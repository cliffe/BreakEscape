# Asset Manifest: Mission 3 - Ghost in the Machine

**Mission ID:** m03_ghost_in_the_machine
**Purpose:** Complete list of required visual, audio, and UI assets for implementation
**Status:** Asset Planning (Pre-Stage 9)
**Date Created:** 2025-12-27

---

## Overview

This manifest documents all assets required to implement Mission 3. Assets are categorized by type and priority level.

**Priority Levels:**
- **CRITICAL:** Required for core gameplay, mission cannot function without these
- **HIGH:** Required for full experience, substitutes acceptable temporarily
- **MEDIUM:** Enhances experience, generic placeholders acceptable
- **LOW:** Polish elements, can be added post-initial implementation

---

## 1. Character Portraits (NPC Dialogue)

### Critical Priority

**Victoria Sterling (Cipher)**
- **Type:** Character portrait
- **Expressions:** 5 variations
  - `victoria_neutral.png` - Default professional demeanor
  - `victoria_persuasive.png` - Sales pitch, confident smile
  - `victoria_defensive.png` - Confrontation, rationalization
  - `victoria_vulnerable.png` - Recruitment path, breaking point
  - `victoria_defiant.png` - Arrest path, ideological conviction
- **Specifications:** 512×512px, transparent background, consistent lighting
- **Usage:** Ink dialogue scripts (m03_npc_victoria.ink)
- **Reference:** Stage 2 character description (professional, mid-30s, business attire)

**Agent 0x99 (Haxolottle - Handler)**
- **Type:** Character portrait
- **Expressions:** 3 variations
  - `agent_0x99_professional.png` - Default handler demeanor
  - `agent_0x99_concerned.png` - M2 revelation, emotional investment
  - `agent_0x99_supportive.png` - Hint system, encouragement
- **Specifications:** 512×512px, axolotl-themed design (quirky but professional)
- **Usage:** Ink dialogue scripts (m03_phone_agent0x99.ink, m03_opening_briefing.ink, m03_closing_debrief.ink)
- **Reference:** Established character from M1/M2 (if exists), or new design

**James Park**
- **Type:** Character portrait
- **Expressions:** 3 variations
  - `james_neutral.png` - Default ethical hacker appearance
  - `james_guilty.png` - Diary discovery, internal conflict
  - `james_desperate.png` - Optional confrontation, fear of consequences
- **Specifications:** 512×512px, professional casual attire, family man aesthetic
- **Usage:** Ink dialogue scripts (m03_james_choice.ink)
- **Reference:** Stage 2 description (early 30s, OSCP/CEH certified, family photos visible)

### High Priority

**Security Guard (Night Patrol)**
- **Type:** Character portrait
- **Expressions:** 2 variations
  - `guard_neutral.png` - Default patrol demeanor
  - `guard_suspicious.png` - Player detected, confrontation
- **Specifications:** 512×512px, security uniform, working-class aesthetic
- **Usage:** Ink dialogue scripts (m03_npc_guard.ink)
- **Reference:** Stage 2 description (50s, procedural adherence, bribeable)

**Receptionist**
- **Type:** Character portrait
- **Expressions:** 1 variation
  - `receptionist_friendly.png` - Helpful professional demeanor
- **Specifications:** 512×512px, business professional attire
- **Usage:** Ink dialogue scripts (m03_npc_receptionist.ink)
- **Reference:** Stage 2 description (friendly, helpful, front desk professional)

---

## 2. Room Backgrounds/Tiles

### Critical Priority

**Reception Lobby** (`reception_lobby`)
- **Type:** Room background
- **Dimensions:** 8×6 GU (usable 6×4 GU with 1 GU padding)
- **Assets Required:**
  - Background image: Modern office reception
  - Props: Reception desk, WhiteHat Security logo, certification display case
  - Interactive: Company founding plaque (2010)
- **Lighting:** Daytime: bright professional; Nighttime: single desk lamp
- **Reference:** Stage 5 room_design.md lines 40-99

**Conference Room** (`conference_room_01`)
- **Type:** Room background
- **Dimensions:** 10×8 GU (usable 8×6 GU)
- **Assets Required:**
  - Background image: Professional conference room
  - Props: Large conference table (seats 8), whiteboard, projector screen, windows
- **Lighting:** Daytime: bright natural light
- **Reference:** Stage 5 room_design.md lines 102-151

**Main Hallway** (`main_hallway`)
- **Type:** Room background
- **Dimensions:** 12×4 GU (usable 10×2 GU)
- **Assets Required:**
  - Background image: Corporate hallway corridor
  - Props: Office doors, corporate carpeting, recessed lighting
- **Lighting:** Daytime: bright; Nighttime: emergency lighting
- **Reference:** Stage 5 room_design.md lines 154-195

**Server Room** (`server_room`) - **INVESTIGATION HUB**
- **Type:** Room background
- **Dimensions:** 10×10 GU (usable 8×8 GU)
- **Assets Required:**
  - Background image: Technical server room
  - Props: Server racks (blinking LEDs - green/amber), 3 workstation areas, filing cabinet, wall-mounted safe, whiteboard with ROT13 message
  - Interactive: VM terminal, CyberChef workstation, drop-site terminal
- **Lighting:** Blue/green tech aesthetic with shadows (nighttime only)
- **Reference:** Stage 5 room_design.md lines 198-309

**Executive Wing Hallway** (`executive_wing_hallway`)
- **Type:** Room background
- **Dimensions:** 8×4 GU (usable 6×2 GU)
- **Assets Required:**
  - Background image: Upscale hallway
  - Props: Wood paneling, framed achievements, premium carpet
- **Reference:** Stage 5 room_design.md lines 312-341

**Executive Office** (`executive_office`) - Victoria's Workspace
- **Type:** Room background
- **Dimensions:** 10×8 GU (usable 8×6 GU)
- **Assets Required:**
  - Background image: Executive office
  - Props: Expensive desk, leather chair, floor-to-ceiling windows, corporate art, filing cabinet, wall safe (behind painting), executive computer
- **Lighting:** Nighttime only (Victoria absent)
- **Reference:** Stage 5 room_design.md lines 344-422

**James's Office** (`james_office`)
- **Type:** Room background
- **Dimensions:** 8×6 GU (usable 6×4 GU)
- **Assets Required:**
  - Background image: Modest consultant office
  - Props: Desk with dual monitors, OSCP/CEH certifications framed, family photos (prominent), neat workspace
- **Lighting:** Nighttime only (James absent)
- **Reference:** Stage 5 room_design.md lines 426-487

---

## 3. Interactive Object Sprites

### Critical Priority

**RFID Cloner Device**
- **Type:** Item sprite + UI overlay
- **Sprite:** Handheld device icon (inventory display)
- **UI Overlay:** Proximity progress bar (10-second timer visualization)
- **Usage:** Conference room minigame (Victoria RFID cloning)
- **Reference:** Stage 0 challenge specification

**VM Terminal Interface**
- **Type:** UI screen overlay
- **Components:**
  - Terminal window with command input
  - nmap output display
  - netcat banner display
  - Metasploit console (distcc exploit)
- **Usage:** Server room VM challenges
- **Reference:** Stage 7 m03_terminal_dropsite.ink

**CyberChef Workstation Interface**
- **Type:** UI screen overlay
- **Components:**
  - Encoding/decoding operation selector (ROT13, Hex, Base64)
  - Input text area
  - Output text area
  - "Decode" button
- **Usage:** Server room encoding challenges
- **Reference:** Stage 7 m03_terminal_cyberchef.ink

### High Priority

**Lockpick Minigame UI**
- **Type:** UI overlay (if custom for this mission)
- **Usage:** Executive office door, filing cabinets
- **Note:** May use existing game system

**Safe PIN Entry Interface**
- **Type:** UI overlay
- **Components:** 4-digit PIN entry, keypad visual
- **Usage:** Server room safe (PIN: 2010)

**Whiteboard with ROT13 Message**
- **Type:** Interactive sprite
- **Content:** "ZRRG JVGU GUR NEPUVGRPG - CEVBEVGVMR VASENFGEHPGHER RKCYBVGF"
- **Usage:** Server room examination

**Computer Login Screen**
- **Type:** UI overlay
- **Usage:** Victoria's executive computer access

**Operational Logs Document**
- **Type:** Text document UI
- **Content:** ProFTPD exploit sale details ($12,500 to GHOST)
- **Usage:** M2 revelation trigger
- **Spawn:** Event-triggered after distcc_exploit

---

## 4. LORE Fragment Documents

### Medium Priority

**LORE Fragment 1: "Zero Day: A Brief History"**
- **Type:** Text document UI (readable in-game)
- **Length:** ~178 words
- **Content:** Victoria's founding philosophy, "monetize entropy" ideology
- **Location:** Executive office filing cabinet
- **Reference:** Stage 6 lore_fragments.md lines 15-100

**LORE Fragment 2: "Q3 2024 Exploit Catalog"**
- **Type:** Text document UI
- **Length:** ~195 words
- **Content:** PRIMARY EVIDENCE - $12,500 hospital exploit listing
- **Location:** Server room safe (PIN 2010)
- **Reference:** Stage 6 lore_fragments.md lines 103-211

**LORE Fragment 3: "The Architect's Directive"**
- **Type:** Text document UI (double-encoded)
- **Length:** ~189 words
- **Content:** PRIMARY EVIDENCE - Phase 2 attack plans
- **Location:** Executive office desk (hidden USB drive)
- **Encoding:** Base64 → ROT13 (two-layer decoding)
- **Reference:** Stage 6 lore_fragments.md lines 214-368

---

## 5. UI Elements

### Critical Priority

**Objectives Tracker**
- **Type:** UI widget (persistent)
- **Data Source:** objectives.json
- **Displays:** Current aim, active tasks, completion status
- **Updates:** Real-time when tasks completed

**Dialogue Box (Ink Integration)**
- **Type:** UI overlay
- **Components:**
  - Speaker name display
  - Character portrait (left side)
  - Dialogue text area
  - Choice buttons (hub pattern support)
- **Tags Support:** #speaker, #display, #complete_task, #unlock_task

### High Priority

**Flag Submission Interface**
- **Type:** Terminal UI overlay
- **Components:**
  - Flag input field
  - Submit button
  - Verification feedback (✓/✗)
  - Narrative intel reveal (post-submission)
- **Usage:** Drop-site terminal (4 VM flags)

**Minimap/Room Navigation**
- **Type:** UI widget
- **Displays:** 7-room layout, current position, locked/unlocked status
- **Accessibility:** Helps players navigate hub-and-spoke layout

### Medium Priority

**Stealth Detection Indicator**
- **Type:** UI alert
- **Components:**
  - Guard proximity warning
  - Line-of-sight cone visualization (optional)
  - Detection meter
- **Usage:** Night security guard patrol

**Trust Level Indicator** (Optional)
- **Type:** UI widget
- **Variable:** `victoria_trust` (0-100)
- **Unlocks:** Alternative paths at trust >= 40
- **Display:** May be hidden/implicit

---

## 6. Sound Effects (SFX)

### High Priority

**Environment**
- `server_room_hvac_loop.ogg` - HVAC hum ambiance (server room)
- `office_ambiance_day.ogg` - Office background (daytime)
- `office_ambiance_night.ogg` - Quiet nighttime ambiance
- `footsteps_guard_patrol.ogg` - Guard walking SFX

**Interactions**
- `lockpick_success.ogg` - Lockpicking completion
- `computer_login.ogg` - Successful computer access
- `flag_submission_success.ogg` - VM flag accepted (✓)
- `flag_submission_failure.ogg` - VM flag rejected (✗)
- `safe_unlock.ogg` - PIN safe opening
- `rfid_clone_progress.ogg` - RFID cloner active (10-second loop)
- `rfid_clone_complete.ogg` - RFID cloning success

**Dialogue**
- `dialogue_advance.ogg` - Text advance click
- `choice_select.ogg` - Dialogue choice selection

### Medium Priority

**Narrative Events**
- `phone_ring.ogg` - Agent 0x99 event call trigger
- `m2_revelation_sting.ogg` - Emotional music cue (hospital attack reveal)
- `evidence_discovery.ogg` - Important document found

**UI Feedback**
- `objective_complete.ogg` - Task completion sound
- `objective_unlock.ogg` - New task unlocked

---

## 7. Music/Ambiance Tracks

### Medium Priority

**Act 1 Theme** - "Undercover"
- **Type:** Background music
- **Mood:** Professional, slightly tense, corporate espionage
- **Usage:** Daytime Victoria meeting, RFID cloning
- **Duration:** 2-3 minute loop

**Act 2 Theme** - "Investigation"
- **Type:** Background music
- **Mood:** Tense investigation, suspenseful
- **Usage:** Nighttime infiltration, server room work
- **Duration:** 4-5 minute loop

**Act 3 Theme** - "Confrontation"
- **Type:** Background music
- **Mood:** Dramatic, morally complex
- **Usage:** Victoria confrontation, James choice, debrief
- **Duration:** 3-4 minute loop

**M2 Revelation Cue**
- **Type:** Music sting (non-looping)
- **Mood:** Emotional impact, gravity of hospital deaths
- **Usage:** distcc flag submission → Agent 0x99 revelation call
- **Duration:** 15-30 seconds

### Low Priority

**Debrief Theme** - "Reflection"
- **Type:** Background music
- **Mood:** Reflective, consequences acknowledged
- **Usage:** Closing debrief with Agent 0x99
- **Duration:** 2-3 minute loop

---

## 8. Animation Assets (If Applicable)

### Low Priority

**Guard Patrol Animation**
- **Type:** Sprite animation
- **Frames:** Walking cycle (4-8 frames)
- **Usage:** Night security guard movement

**RFID Clone Progress Bar**
- **Type:** UI animation
- **Behavior:** Fill animation (0% → 100% over 10 seconds)

**Server LED Blink**
- **Type:** Environmental animation
- **Behavior:** Random blinking green/amber LEDs on server racks

---

## Implementation Notes

### Asset Pipeline
1. **Critical assets** should be prioritized for Stage 9 initial implementation
2. **High priority** assets should be completed before playtesting
3. **Medium/Low priority** assets can use placeholders initially

### Placeholder Strategy
- **Character portraits:** Use colored shapes with text labels (e.g., "Victoria - Cipher")
- **Room backgrounds:** Use simple colored backgrounds matching descriptions
- **SFX:** Use royalty-free library sounds temporarily
- **Music:** Silence or simple ambiance acceptable for initial build

### File Naming Convention
- Use lowercase with underscores: `character_expression.png`
- Prefix by category: `sfx_`, `music_`, `ui_`, `room_`, `char_`
- Include mission ID where relevant: `m03_victoria_neutral.png`

### Estimated Asset Count
- **Character Portraits:** 14 files (5 Victoria + 3 Agent 0x99 + 3 James + 2 Guard + 1 Receptionist)
- **Room Backgrounds:** 7 files
- **Interactive Objects:** ~15 UI overlays/sprites
- **LORE Documents:** 3 text UIs
- **UI Elements:** ~8 widgets
- **Sound Effects:** ~15-20 files
- **Music Tracks:** 4-5 files
- **Total:** ~60-70 asset files

---

**Manifest Status:** DRAFT - Ready for art team review
**Next Step:** Coordinate with art team for asset creation schedule
**Integration:** Assets will be referenced in Stage 9 scenario assembly

---

**Created:** 2025-12-27
**For:** Mission 3 - Ghost in the Machine
**Stage 9 Preparation**
