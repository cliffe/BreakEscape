> ⚠️ **SUPERSEDED (2026-08-21).** These stage documents describe the original **water-treatment**
> concept for m04 (chlorine dosing, Dec 2025). The mission was rebuilt as **grid battery storage**
> (Albion Energy Storage) and then aligned to the m01 standard. They are kept for historical
> reference only. The authoritative design is `scenarios/m04_critical_failure/ALIGNMENT_PLAN.md`;
> the current implementation is the scenario and ink files themselves.

# Mission 4: "Critical Failure" - Stage 7: Asset Manifest

**Mission ID:** m04_critical_failure
**Stage:** 7 - Asset Manifest
**Version:** 1.0
**Date:** 2025-12-28

---

## Overview

This document provides a complete manifest of all assets required for Mission 4 "Critical Failure," including character sprites, animations, environment art, UI elements, sound effects, music, and item icons. All assets are categorized by type and linked to their usage within the mission.

---

## Character Sprites & Animations

### Robert Chen (Facility Manager)

**Sprite File:** `robert_chen.png`
**Dimensions:** 32x32 base sprite (scaled for display)
**Variations:** 6 emotional states

**Costume Elements:**
- Facility polo shirt (blue with logo)
- Khaki pants
- Glasses (defining feature)
- Safety shoes
- Tablet or clipboard in hand

**Sprite Variations:**

1. **Default (Neutral):**
   - Idle stance
   - Holding tablet
   - Professional posture

2. **Annoyed (Act 1 - Initial Meeting):**
   - Crossed arms or hand on hip
   - Slight frown
   - Defensive body language

3. **Alarmed (Discovery):**
   - Wide eyes behind glasses
   - Leaning forward
   - Urgent gestures

4. **Focused (Act 2 - Crisis Mode):**
   - At SCADA terminal
   - Intense concentration
   - Working posture

5. **Stressed (Act 3 - Emergency):**
   - Running hand through hair
   - Rubbing eyes
   - Tension visible

6. **Grateful (Resolution):**
   - Relaxed shoulders
   - Slight smile
   - Relief visible

**Animations Required:**

- `chen_idle` - Standing with tablet (loop)
- `chen_walk` - Professional walking pace (4 frames)
- `chen_talk` - Gesturing while explaining (4 frames, loop)
- `chen_work_terminal` - Typing at SCADA console (4 frames, loop)
- `chen_stressed` - Adjusting glasses, running hand through hair (6 frames)
- `chen_alarmed` - Sudden reaction, leaning forward (4 frames)
- `chen_relieved` - Exhaling, slumping shoulders (4 frames)

**Total Frames:** ~30 frames across all animations

---

### Voltage (Critical Mass Leader)

**Sprite File:** `voltage.png`
**Dimensions:** 32x32 base sprite
**Variations:** 4 tactical states

**Costume Elements:**
- Dark cargo pants
- Utility jacket
- Tactical vest (modular pouches)
- Combat boots
- Radio earpiece
- Gloves

**Sprite Variations:**

1. **Default (Tactical Awareness):**
   - Alert stance
   - Hand near equipment
   - Confident posture

2. **Working (Laptop Operation):**
   - Seated at command laptop
   - Focused on screen
   - One hand on keyboard

3. **Combat Ready:**
   - Defensive stance
   - Cover position
   - Tactical movement

4. **Threatened:**
   - Hand near trigger laptop
   - Tense posture
   - Ready to act

**Animations Required:**

- `voltage_idle` - Tactical stance (loop)
- `voltage_walk` - Confident tactical movement (4 frames)
- `voltage_work_laptop` - Operating attack trigger (4 frames, loop)
- `voltage_combat` - Combat defensive posture (4 frames)
- `voltage_escape` - Running toward loading dock (6 frames)
- `voltage_captured` - Hands restrained, defiant (static or 2 frames)

**Total Frames:** ~24 frames

---

### Critical Mass Operatives (×3)

**Sprite Files:** `operative_cipher.png`, `operative_relay.png`, `operative_static.png`
**Dimensions:** 32x32 base sprite each
**Shared Base Design:** Tactical casual clothing with variations

**Operative #1 (Cipher) - Technical Specialist:**
- Lighter tactical gear
- Tool belt visible
- Working posture default

**Operative #2 (Relay) - Security/Patrol:**
- Medium tactical vest
- Patrol stance default
- Alert scanning posture

**Operative #3 (Static) - Heavy Support:**
- Heavier tactical vest
- Solid build
- Defensive stance default

**Shared Animations:**

- `operative_idle` - Alert stance (loop)
- `operative_walk` - Tactical patrol (4 frames)
- `operative_run` - Combat movement (4 frames)
- `operative_combat` - Fighting stance (4 frames)
- `operative_work` - Tampering with equipment (4 frames, Cipher only)
- `operative_patrol` - Looking around (4 frames, Relay only)
- `operative_defeated` - Incapacitated on ground (static)

**Total Frames per Operative:** ~20 frames each
**Combined Total:** ~60 frames for all three

---

### Agent 0x99 (Handler - Video/Portrait)

**Asset Files:** `agent_0x99_portrait.png`, `agent_0x99_video_background.png`
**Format:** Portrait for dialogue, video call background
**Dimensions:** 128x128 portrait, 320x240 video background

**Variations:**

1. **Neutral (Briefing):**
   - Professional composure
   - SAFETYNET facility background

2. **Concerned (Mid-mission updates):**
   - Slight worry
   - Urgency visible

3. **Satisfied (Debrief):**
   - Approval
   - Mission success acknowledged

**Animations:** Minimal (talking portrait with mouth movement, 2-3 frames)

**Total Frames:** ~6 frames (portrait variations)

---

### Security Guard (Minor NPC)

**Sprite File:** `security_guard.png`
**Dimensions:** 32x32 base sprite
**Variations:** 2 states

**Costume:**
- Security uniform
- Badge visible
- Seated at desk default

**Animations:**

- `guard_idle_seated` - At desk (loop)
- `guard_talk` - Conversation (2 frames)
- `guard_check_credentials` - Examining clipboard (4 frames)
- `guard_wave_through` - Gesturing to entry (2 frames)

**Total Frames:** ~10 frames

---

### Background Employees (Ambient NPCs)

**Sprite Files:** `employee_generic_1.png` through `employee_generic_4.png`
**Dimensions:** 32x32 base sprite each
**Purpose:** Ambient movement, shift change atmosphere

**Variations:**
- Facility work uniforms (various colors)
- Lab coats (technicians)
- Casual work clothes
- Diverse appearances

**Animations (Shared):**

- `employee_walk` - Casual walking (4 frames)
- `employee_talk` - Background conversation (2 frames)
- `employee_idle` - Standing (loop)

**Total Frames:** ~8 frames per employee × 4 = ~32 frames

---

### Player Character (Agent 0x00)

**Sprite File:** `player_agent.png`
**Dimensions:** 32x32 base sprite
**Variations:** Combat and stealth states (inherited from M1-M3)

**Mission 4 Specific Additions:**

**Combat Animations (New for M4):**
- `player_combat_idle` - Combat ready stance (loop)
- `player_combat_attack` - Non-lethal takedown (6 frames)
- `player_combat_dodge` - Evasive movement (4 frames)
- `player_stealth_takedown` - Silent incapacitation (6 frames)
- `player_use_cover` - Behind cover position (4 frames)

**Total New Frames for M4:** ~24 combat-specific frames

---

## Environment Art Assets

### Room Tilesets

**Tileset Files Required:**

1. **Industrial Facility Base Tileset** (`tileset_industrial.png`)
   - Concrete floors (normal, worn, cracked variations)
   - Industrial walls (painted, bare concrete)
   - Metal grating (walkways, platforms)
   - Ceiling tiles (drop ceiling, exposed beams)
   - Doors (standard, secure, emergency exit)
   - Windows (office, high industrial)

2. **SCADA/Control Room Tileset** (`tileset_control_room.png`)
   - Technical flooring (raised floor panels)
   - Monitor arrays (wall-mounted)
   - Control panels (various sizes)
   - Server racks (with LED indicators)
   - Cable management (overhead, floor)

3. **Chemical Storage Tileset** (`tileset_chemical_storage.png`)
   - Chemical tanks (yellow, hazard-marked)
   - Containment berms
   - Safety stations (eye wash, showers)
   - Hazard signage
   - Ventilation equipment

**Tile Dimensions:** 32x32 pixels per tile
**Estimated Tileset Sizes:** 512x512 pixels each (256 tiles per set)

---

### Large Environmental Objects

**Industrial Equipment:**

1. **Treatment Tanks** (`obj_treatment_tank.png`)
   - Large cylindrical tanks
   - Metallic texture
   - Variations: 128x128 pixels

2. **Pump Systems** (`obj_pump_station.png`)
   - Industrial pumps with pipes
   - Variations: 96x96 pixels

3. **Chemical Storage Tanks** (`obj_chemical_tank.png`)
   - Yellow hazard tanks
   - Skull/crossbones symbols
   - Variations: 96x128 pixels (tall)

4. **Backup Generator** (`obj_generator.png`)
   - Large industrial generator
   - Running state indicators
   - Size: 128x96 pixels

5. **Server Racks** (`obj_server_rack.png`)
   - Multiple racks with LED indicators
   - Variations: Pristine, tampered
   - Size: 64x96 pixels (tall)

6. **SCADA Monitor Array** (`obj_scada_monitors.png`)
   - Wall-mounted monitor bank
   - Multiple screens showing data
   - Size: 192x128 pixels (wide)

7. **Metal Catwalks** (`obj_catwalk.png`)
   - Walkway sections
   - Railings visible
   - Tileable: 32x64 pixels per section

**Total Large Object Assets:** ~15 unique objects with variations

---

### Furniture & Props

**Office Furniture:**
- `obj_desk.png` - Standard office desk (64x32)
- `obj_cubicle_divider.png` - Office cubicle walls (32x48)
- `obj_filing_cabinet.png` - 4-drawer cabinet (32x48)
- `obj_office_chair.png` - Rolling chair (24x24)
- `obj_coffee_station.png` - Coffee maker area (48x32)
- `obj_water_cooler.png` - Water dispenser (24x48)

**Industrial Props:**
- `obj_tool_bench.png` - Workbench with tools (96x48)
- `obj_tool_cache.png` - Tool storage locker (48x64)
- `obj_forklift.png` - Loading dock forklift (64x96)
- `obj_pallet_jack.png` - Hand pallet jack (32x64)
- `obj_storage_container.png` - Large shipping container (128x96)

**Security/Safety:**
- `obj_security_desk.png` - Security checkpoint desk (96x48)
- `obj_metal_detector.png` - Archway scanner (48x96)
- `obj_fire_extinguisher.png` - Wall-mounted extinguisher (16x32)
- `obj_first_aid_station.png` - First aid cabinet (32x48)
- `obj_eye_wash_station.png` - Emergency eye wash (32x48)

**Technical Equipment:**
- `obj_control_terminal.png` - SCADA operator station (64x64)
- `obj_network_terminal.png` - Server room workstation (64x48)
- `obj_laptop_entropy.png` - Attack trigger laptop (32x24)
- `obj_radio_equipment.png` - Communications gear (48x32)

**Total Furniture/Props:** ~30 unique assets

---

### Interactive Objects (Special States)

**Dosing Control Panels** (`obj_dosing_control_1/2/3.png`):
- Normal state
- Bypass device installed (visible tampering)
- Warning indicators active
- Disabled state (after Task 3.2)
- Size: 48x64 pixels
- 4 states × 3 panels = 12 variations

**Doors with States:**
- `obj_door_closed.png` - Standard closed door
- `obj_door_open.png` - Open door
- `obj_door_locked.png` - Locked (keycard reader visible)
- `obj_door_emergency.png` - Emergency exit (alarm bar)
- 4 variations × 3 types (standard, secure, maintenance) = 12 door assets

**ENTROPY Equipment:**
- `obj_tactical_vest.png` - Operative equipment (48x48)
- `obj_radio_encrypted.png` - Encrypted radio (24x24)
- `obj_bypass_device.png` - Attack hardware (32x32)
- `obj_entropy_van.png` - Rental van exterior (128x96)

---

## UI Elements

### SCADA Interface

**Main SCADA Display** (`ui_scada_main.png`):
- Full screen overlay: 800x600 pixels
- Monitor frame with facility status
- Color-coded indicators (green/yellow/orange/red)
- Parameter readouts
- Alert log section

**SCADA Components (Modular):**

1. **Status Indicators** (`ui_scada_indicators.png`):
   - Circular gauges (green/yellow/red states)
   - Size: 64x64 per gauge
   - Variations: 3 colors × 4 gauge types = 12 assets

2. **Parameter Displays** (`ui_scada_parameters.png`):
   - Numerical readouts
   - Trend graphs (line charts)
   - Size: 128x96 per display panel

3. **Alert Banners** (`ui_scada_alerts.png`):
   - Warning banners (yellow)
   - Critical alerts (red, flashing)
   - Info notices (blue)
   - Size: 400x48 per banner type

4. **Chemical Dosing Readout** (`ui_dosing_display.png`):
   - Station 1, 2, 3 individual displays
   - Current ppm levels
   - Warning thresholds visible
   - Size: 256x128 per station display

**Urgency Stage Visual Progression:**
- Stage 1: All green indicators
- Stage 2: Yellow warnings appear
- Stage 3: Orange/red warnings, multiple systems
- Stage 4: Flashing red, emergency state
- Stage 5: Clearing warnings, stabilizing

**Total SCADA UI Assets:** ~25 components

---

### Mission-Specific UI

**Urgency Stage Indicator** (`ui_urgency_indicator.png`):
- Replaces timer UI
- 5 stage progression bar
- Visual: Facility status icon with color progression
- Size: 64x16 pixels
- States: 5 variations (green → red)

**Objective Panel Updates:**
- Standard Break Escape objective UI
- M4-specific task icons for:
  - SCADA investigation icon
  - Combat encounter icon
  - Flag submission icon
  - Attack disabling icon

**Chen Trust Level Indicator** (Optional):
- Subtle UI element showing cooperation level
- 5 states: Defensive → Cooperative → Strong Ally
- Size: 32x32 icon

**Radio Monitoring Interface** (`ui_radio_monitor.png`):
- If player obtains encrypted radio from Operative #1
- Shows operative chatter
- Scrolling text display
- Size: 300x100 pixels

---

### Item Icons

**Required Item Icons (32x32 pixels each):**

**Access Items:**
- `icon_visitor_badge.png` - Visitor ID badge
- `icon_keycard_level1.png` - Blue keycard
- `icon_keycard_level2.png` - Yellow keycard
- `icon_keycard_master.png` - Red keycard

**Evidence Items:**
- `icon_maintenance_logs.png` - Document/clipboard
- `icon_security_logs.png` - Security report
- `icon_scada_data.png` - Data file icon
- `icon_optigrid_badge.png` - OptiGrid ID badge

**Intelligence Items:**
- `icon_cipher_note.png` - Handwritten note
- `icon_relay_note.png` - Intelligence document
- `icon_comm_log.png` - Communication logs
- `icon_architect_comm.png` - Special encrypted message
- `icon_facility_log.png` - Multi-facility access records
- `icon_planning_usb.png` - USB drive

**Equipment Items:**
- `icon_encrypted_radio.png` - Tactical radio
- `icon_flashlight.png` - Flashlight
- `icon_facility_map.png` - Facility blueprint

**VM Flags (Special Icons):**
- `icon_flag_network_scan.png` - Network topology flag
- `icon_flag_ftp.png` - FTP intelligence flag
- `icon_flag_http.png` - HTTP analysis flag
- `icon_flag_distcc.png` - Distcc exploit flag

**Total Item Icons:** ~25 icons

---

## Sound Effects

### Environmental Ambience

**Facility Ambient Loops:**

1. **`amb_facility_normal.ogg`**
   - Machinery hum (40-60 Hz)
   - Water flow sounds
   - Ventilation white noise
   - Duration: 2 minutes (loop)
   - Volume: Background level

2. **`amb_control_room.ogg`**
   - Electronic equipment hum
   - SCADA terminal beeps (occasional)
   - HVAC system
   - Duration: 2 minutes (loop)

3. **`amb_treatment_floor.ogg`**
   - Loud industrial pumps
   - Water treatment sounds
   - Metal clanking
   - Echoing acoustics
   - Duration: 2 minutes (loop)

4. **`amb_chemical_storage.ogg`**
   - Ventilation fans (prominent)
   - Chemical pump operation
   - Safety system status tones
   - Duration: 2 minutes (loop)

5. **`amb_server_room.ogg`**
   - Server fan noise (constant, loud)
   - Hard drive activity
   - Cooling system
   - Network switch clicks
   - Duration: 2 minutes (loop)

6. **`amb_loading_dock.ogg`**
   - Outdoor ambient (birds, distant traffic)
   - Facility machinery audible from outside
   - Vehicle sounds (occasional)
   - Duration: 2 minutes (loop)

---

### Urgency Stage Sound Design

**Stage 1 (Normal Operations):**
- `alert_stage1_beep.ogg` - Occasional system beep (Info level)
- Calm background ambience

**Stage 2 (Anomaly Detected):**
- `alert_stage2_warning.ogg` - Alert beeps (more frequent)
- `scada_warning_tone.ogg` - Low priority warning sound
- Irregular pump sounds added to ambient

**Stage 3 (Critical Warning):**
- `alert_stage3_urgent.ogg` - Frequent alert tones
- `alarm_prewarn.ogg` - Pre-alarm klaxon (low volume)
- `steam_release.ogg` - Pressure relief sounds
- `pa_safety_reminder.ogg` - Facility PA announcements

**Stage 4 (Emergency):**
- `alarm_stage4_emergency.ogg` - Full klaxon alarm (loud, piercing)
- `emergency_broadcast.ogg` - Emergency tone pattern
- `chemical_leak_alarm.ogg` - Gas detection warning
- `evacuation_announcement.ogg` - PA evacuation order

**Stage 5 (Stabilizing):**
- `alarm_silence.ogg` - Alarms powering down
- `system_stabilize.ogg` - Alert tones decreasing frequency
- `all_clear_tone.ogg` - Single tone indicating crisis resolved

**Total Urgency Sounds:** ~15 sound effects

---

### Combat Sounds

**Player Combat:**
- `combat_punch.ogg` - Melee hit (non-lethal)
- `combat_takedown.ogg` - Takedown impact
- `combat_dodge.ogg` - Evasive movement sound
- `stealth_takedown.ogg` - Silent incapacitation (quiet)

**Operative Combat:**
- `operative_grunt.ogg` - Combat effort sound (×3 variations)
- `operative_alert_shout.ogg` - "Intruder!" alert
- `operative_defeated.ogg` - Incapacitation sound
- `operative_footsteps_run.ogg` - Running footsteps

**Combat Environmental:**
- `cover_impact.ogg` - Hitting cover (metal/concrete)
- `equipment_knock.ogg` - Bumping into equipment
- `metal_clang.ogg` - Industrial metal impact

**Total Combat Sounds:** ~15 sound effects

---

### Interaction Sounds

**Doors:**
- `door_open.ogg` - Standard door opening
- `door_close.ogg` - Door closing
- `door_locked.ogg` - Locked door rattle
- `door_keycard.ogg` - Keycard reader beep (success)
- `door_keycard_fail.ogg` - Access denied beep

**Computers/Terminals:**
- `terminal_login.ogg` - Computer access
- `terminal_typing.ogg` - Keyboard typing (loop)
- `terminal_logout.ogg` - Log off sound
- `vm_launch.ogg` - VM challenge starting
- `flag_submit.ogg` - Flag submission success

**Items:**
- `item_pickup.ogg` - Collecting item
- `item_examine.ogg` - Inspecting object
- `keycard_obtain.ogg` - Receiving access card
- `radio_static.ogg` - Encrypted radio activation

**SCADA Interactions:**
- `scada_parameter_change.ogg` - Adjusting settings
- `scada_override.ogg` - Manual override action
- `attack_disable.ogg` - Disabling attack vector (satisfying sound)

**Total Interaction Sounds:** ~20 sound effects

---

### Dialogue & Voice

**Voice Acting Files:**
- Total estimated: 245-295 voice lines (from Stage 6)
- Format: .ogg, mono, 44.1kHz
- Naming: `vo_[character]_[scene]_[line#].ogg`

**Example Structure:**
- `vo_chen_initial_meeting_01.ogg` through `vo_chen_initial_meeting_50.ogg`
- `vo_voltage_confrontation_01.ogg` through `vo_voltage_confrontation_45.ogg`
- `vo_0x99_briefing_01.ogg` through `vo_0x99_briefing_30.ogg`

**Radio Chatter (Operative Communications):**
- `radio_cipher_alert_01.ogg` - "Voltage, we're compromised!"
- `radio_relay_patrol_01.ogg` - "Relay, all clear in sector 2"
- `radio_static_support_01.ogg` - "Voltage, we have company!"
- Processed with radio effect (compression, static)

---

## Music & Soundscapes

### Music Tracks

**Mission 4 requires 5 music tracks:**

1. **`music_m04_infiltration.ogg`**
   - Mood: Tense investigation, underlying urgency
   - Tempo: Moderate (90-100 BPM)
   - Instruments: Electronic tension, industrial percussion
   - Duration: 3-4 minutes (loop)
   - Usage: Act 1, facility entry and investigation

2. **`music_m04_investigation.ogg`**
   - Mood: Active investigation, building tension
   - Tempo: Moderate-fast (100-110 BPM)
   - Instruments: Electronic pulses, strings for urgency
   - Duration: 4-5 minutes (loop)
   - Usage: Act 2, SCADA investigation and VM challenges

3. **`music_m04_combat.ogg`**
   - Mood: Action intensity, tactical engagement
   - Tempo: Fast (120-130 BPM)
   - Instruments: Heavy electronic beats, aggressive synths
   - Duration: 2-3 minutes (loop)
   - Usage: Combat encounters

4. **`music_m04_crisis.ogg`**
   - Mood: Maximum urgency, race against time
   - Tempo: Very fast (130-140 BPM)
   - Instruments: Driving percussion, intense synths, industrial sounds
   - Duration: 3-4 minutes (loop)
   - Usage: Act 3, Voltage confrontation and attack disabling

5. **`music_m04_resolution.ogg`**
   - Mood: Relief, reflection, victory with consequences
   - Tempo: Slow-moderate (70-80 BPM)
   - Instruments: Ambient pads, subtle melodies, calming progression
   - Duration: 2-3 minutes (no loop, plays through to debrief)
   - Usage: Crisis resolved, Chen farewell, 0x99 debrief

**Total Music Duration:** ~15-20 minutes of original music

---

### Dynamic Music System

**Urgency-Linked Music Transitions:**

- **Stage 1-2:** `music_m04_infiltration.ogg` → `music_m04_investigation.ogg`
- **Combat Triggered:** Crossfade to `music_m04_combat.ogg`
- **Stage 3-4:** Intensify to `music_m04_crisis.ogg`
- **Stage 5:** Calm to `music_m04_resolution.ogg`

**Transition Method:** 2-second crossfade between tracks

---

## Asset Summary by Category

### Character Assets

| Category | Count | Total Frames/Files |
|----------|-------|-------------------|
| Robert Chen | 1 character | ~30 animation frames |
| Voltage | 1 character | ~24 animation frames |
| Operatives | 3 characters | ~60 animation frames |
| Agent 0x99 | 1 character | ~6 portrait frames |
| Security Guard | 1 character | ~10 animation frames |
| Background Employees | 4 characters | ~32 animation frames |
| Player (M4 additions) | 1 character | ~24 new combat frames |
| **TOTAL** | **12 characters** | **~186 animation frames** |

---

### Environment Assets

| Category | Count | Notes |
|----------|-------|-------|
| Tilesets | 3 sets | 512x512 each, ~256 tiles per set |
| Large Objects | 15 objects | Treatment tanks, pumps, servers, etc. |
| Furniture/Props | 30 objects | Desks, benches, equipment |
| Interactive Objects | 24 objects | Doors, panels, special states |
| **TOTAL** | **72 unique assets** | Plus tileset variations |

---

### UI Assets

| Category | Count | Notes |
|----------|-------|-------|
| SCADA Interface Components | 25 elements | Gauges, displays, alerts, readouts |
| Mission UI | 5 elements | Urgency indicator, objective icons |
| Item Icons | 25 icons | Access, evidence, intelligence, equipment |
| **TOTAL** | **55 UI elements** | 32x32 to 800x600 pixels |

---

### Audio Assets

| Category | Count | Duration/Notes |
|----------|-------|----------------|
| Environmental Ambience | 6 loops | 2 minutes each, looping |
| Urgency Stage Sounds | 15 effects | Alert tones, alarms, PA announcements |
| Combat Sounds | 15 effects | Punches, takedowns, footsteps |
| Interaction Sounds | 20 effects | Doors, terminals, items |
| Voice Acting | 245-295 lines | Robert Chen, Voltage, 0x99, others |
| Music Tracks | 5 tracks | 15-20 minutes total original music |
| **TOTAL** | **~300-350 audio files** | Includes all VO, SFX, music |

---

## Asset Production Priority

### Phase 1: Critical Path Assets (Week 1-2)

**Essential for Core Gameplay:**
1. Player combat animations (24 frames)
2. Robert Chen sprites and animations (30 frames)
3. Voltage sprites and animations (24 frames)
4. Operative sprites (basic, 60 frames)
5. Industrial facility tileset (512x512)
6. SCADA interface UI (25 components)
7. Core ambient sounds (6 loops)
8. Item icons (25 icons)

**Estimated Time:** 80-100 hours (art) + 40-60 hours (audio)

---

### Phase 2: NPC & Environment Assets (Week 3-4)

**Enhances Atmosphere:**
1. Security guard and background employees (42 frames)
2. Agent 0x99 portraits (6 frames)
3. SCADA/Chemical storage tilesets (1024x512 combined)
4. Furniture and props (30 objects)
5. Large environmental objects (15 objects)
6. Urgency stage sound effects (15 sounds)
7. Combat sounds (15 sounds)

**Estimated Time:** 60-80 hours (art) + 30-40 hours (audio)

---

### Phase 3: Polish & Voice (Week 5-6)

**Final Quality:**
1. Interactive object special states (24 variations)
2. Interaction sounds (20 effects)
3. Voice acting recording (245-295 lines)
4. Music composition (5 tracks, 15-20 minutes)
5. UI polish and effects
6. Environmental details

**Estimated Time:** 40-60 hours (art) + 80-100 hours (audio + VO)

---

## Asset File Structure

```
assets/missions/m04_critical_failure/
├── sprites/
│   ├── characters/
│   │   ├── robert_chen.png
│   │   ├── voltage.png
│   │   ├── operative_cipher.png
│   │   ├── operative_relay.png
│   │   ├── operative_static.png
│   │   ├── agent_0x99_portrait.png
│   │   ├── security_guard.png
│   │   └── employee_generic_[1-4].png
│   ├── player/
│   │   └── player_agent_combat.png
│   └── objects/
│       ├── industrial/
│       ├── furniture/
│       └── props/
├── tilesets/
│   ├── tileset_industrial.png
│   ├── tileset_control_room.png
│   └── tileset_chemical_storage.png
├── ui/
│   ├── scada/
│   │   ├── ui_scada_main.png
│   │   ├── ui_scada_indicators.png
│   │   └── ui_scada_parameters.png
│   ├── mission/
│   │   └── ui_urgency_indicator.png
│   └── items/
│       └── [icon files]
├── audio/
│   ├── ambience/
│   │   └── [ambient loop files]
│   ├── sfx/
│   │   ├── urgency/
│   │   ├── combat/
│   │   └── interaction/
│   ├── voice/
│   │   ├── chen/
│   │   ├── voltage/
│   │   ├── 0x99/
│   │   └── operatives/
│   └── music/
│       └── [music track files]
└── README_ASSETS.md
```

---

## Technical Specifications

### Sprite Specifications

- **Format:** PNG with transparency
- **Base Size:** 32x32 pixels per character
- **Color Depth:** 32-bit RGBA
- **Scaling:** 2x or 3x for display (pixel art aesthetic)
- **Animation Frame Rate:** 8-12 FPS (dependent on animation)

### Tileset Specifications

- **Format:** PNG with transparency where needed
- **Tile Size:** 32x32 pixels
- **Tileset Dimensions:** 512x512 pixels (16x16 tiles)
- **Color Depth:** 32-bit RGBA
- **Organization:** Logical grouping (floors, walls, objects)

### UI Specifications

- **Format:** PNG with transparency
- **Dimensions:** Varied (32x32 for icons, up to 800x600 for overlays)
- **Color Depth:** 32-bit RGBA
- **Design Style:** Industrial/technical aesthetic matching facility theme

### Audio Specifications

**Sound Effects:**
- **Format:** OGG Vorbis
- **Sample Rate:** 44.1kHz
- **Bit Depth:** 16-bit
- **Channels:** Mono (ambient/SFX), Stereo (music)
- **Compression:** Quality 5-7 (OGG)

**Voice Acting:**
- **Format:** OGG Vorbis
- **Sample Rate:** 44.1kHz
- **Bit Depth:** 16-bit
- **Channels:** Mono
- **Processing:** Noise reduction, normalization, radio effect for radio chatter

**Music:**
- **Format:** OGG Vorbis
- **Sample Rate:** 44.1kHz
- **Bit Depth:** 16-bit
- **Channels:** Stereo
- **Compression:** Quality 7-9 (OGG, higher quality for music)

---

## Asset Dependencies from Previous Missions

**Reusable from M1-M3:**

1. **Player Base Sprite:** Core player character design
2. **Base UI Framework:** Objective panel, inventory, dialogue boxes
3. **Agent 0x99 Portrait:** Consistent handler appearance
4. **Generic SFX:** Footsteps, menu sounds, generic interactions
5. **Base Tilesets:** Some generic office/industrial elements

**Mission 4 Unique Requirements:**
- Industrial water treatment facility environment (new)
- SCADA interface UI (completely new)
- Combat animations (new system)
- Urgency progression sounds (new)
- All character sprites except player and 0x99 (new)

---

## Success Criteria for Assets

### Visual Quality:
- 90%+ assets match industrial facility aesthetic
- Character sprites clearly distinguishable
- SCADA interface readable and authentic-looking
- Animation framerate smooth at target FPS

### Audio Quality:
- 85%+ players report sound design enhanced immersion
- Urgency progression audibly clear
- Voice acting quality professional
- Music supports emotional beats

### Performance:
- All assets optimized for target platform
- Total asset package <500MB compressed
- Load times <3 seconds per room transition
- Smooth animation playback

---

## Stage 7 Completion Checklist

- [x] Character sprite requirements defined
- [x] Character animation frame counts estimated
- [x] Environment tileset specifications complete
- [x] Environmental object list comprehensive
- [x] UI element requirements detailed
- [x] Item icon manifest complete
- [x] Sound effect categories defined
- [x] Voice acting file structure planned
- [x] Music track requirements specified
- [x] Asset production priority phases outlined
- [x] File structure organized
- [x] Technical specifications documented

---

## Next Stage Preparation

**Stage 8: VM Integration and SecGen Configuration**
- SecGen scenario selection and configuration
- VM network topology design
- Flag placement and validation
- Challenge difficulty tuning
- VM-launcher and flag-station integration
- Testing and validation procedures

**Key Questions for Stage 8:**
- What specific SecGen scenario best matches narrative?
- How are VM challenges balanced for intermediate players?
- What network configuration supports the SCADA investigation story?
- How do we ensure flags are discoverable but not trivial?

---

**Status:** Stage 7 Complete - Ready for Stage 8
**Estimated Asset Production Time:** 180-240 hours total (art + audio + VO)
**Quality Assessment:** Comprehensive asset manifest with production priorities, technical specifications, and clear organization for art and audio teams

---

*Stage 7 establishes the complete asset requirements for Mission 4, providing detailed specifications for all visual, audio, and UI elements. The manifest supports efficient production planning with clear priorities and technical requirements.*
