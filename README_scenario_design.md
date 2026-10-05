# Scenario Design Constraints in Hacktivity Cyber Security Labs

There are several constraints and patterns for designing scenarios for BreakEscape.

---

## Scenario Validator

The validator script renders your ERB template to JSON, validates it against the schema, and checks for structural issues, bad cross-references, and missing best-practice fields.

### Prerequisites

The `json-schema` gem is required:

```bash
gem install json-schema
# or add to Gemfile: gem 'json-schema', then bundle install
```

### Running the Validator

```bash
# Basic validation
ruby scripts/validate_scenario.rb scenarios/my_scenario/scenario.json.erb

# Specify a custom schema path
ruby scripts/validate_scenario.rb scenarios/my_scenario/scenario.json.erb --schema scripts/scenario-schema.json

# Verbose output (includes full JSON on schema failure)
ruby scripts/validate_scenario.rb scenarios/my_scenario/scenario.json.erb --verbose

# Print the rendered JSON to stdout (useful for debugging ERB substitution)
ruby scripts/validate_scenario.rb scenarios/my_scenario/scenario.json.erb --output-json
```

### What the Validator Checks

The validator performs three phases:

1. **ERB rendering** – renders the `.json.erb` template with randomised placeholder values (`random_password`, `random_pin`, `random_code`, `vm_object()`, `flags_for_vm()`)
2. **Schema validation** – checks the rendered JSON against `scripts/scenario-schema.json`
3. **Common issues** – structural checks including:
   - Object types with no matching sprite file in `public/break_escape/assets/objects/`
   - Containers with `contents` that are missing the required `locked` field
   - Key locks and key items missing the required `keyPins` array
   - Room connections using invalid directions (only `north`, `south`, `east`, `west`)
   - Missing or non-bidirectional room connections
   - `onRead.setVariable` / `onPickup.setVariable` referencing variables not in `globalVariables`
   - `globalVarOnKO` / `taskOnKO` cross-references on NPCs
   - **NPC knockout resilience** — required tasks whose only completion path is a KO-vulnerable conversation (a `#complete_task` ink tag on a person NPC) with no `taskOnKO` or `eventMapping` fallback
   - NPC `timedConversation` using `knot` instead of `targetKnot`
   - Phone NPC pitfalls (`targetKnot` in eventMappings, `conversationMode` on phone NPCs, etc.)
   - NPC `los` fields, including `los.challengeOnSight` (unknown fields, a challenge on a non-person NPC, or a `player_spotted` event no `eventMapping` listens for)
   - **Voice FX** (`voice.fx`) — unknown preset names, unrecognised custom-FX keys, and out-of-range values (e.g. `ringMod.mix` outside 0–1)
   - Task `targetNPC`, `targetRoom`, `targetObject` cross-references
   - `collection_group` on items without a matching task `targetGroup`, and vice-versa
   - Music events referencing undefined NPCs or global variables
   - Several `itemsHeld` entries sharing a `type` with no `id` to tell them apart (`#give_item` matches on `type` first, then `id`/`opens_lock`/`name`; without a distinguishing `id` the first one always wins)
   - `vm-launcher` missing `vm` or `hacktivityMode` fields
   - `launch-device` missing required fields
   - **Minigame configuration** (`minigameData`) with undeclared fields or missing required fields per `scripts/minigame-data-schemas.json`
   - **Ink speaker prefixes** that resolve to no NPC `id` / `displayName` (the engine would render the literal `Name: ...` inside another character's bubble)
   - **Ink character hazards** — `//` inside dialogue, a standalone `*emote*` at line start, `**bold**`, unpaired `*`, unbalanced `[ ]` in a choice
   - **`submit_flags` tasks** missing `targetFlags` / `targetCount` (the task could never complete)
   - **Recurring bugs from pass 4** (`check_recurring_bugs`; see [Common bugs and how to avoid them](#common-bugs-and-how-to-avoid-them)): `lockpick_used_in_view` catches that can never fire, NPCs outside the start room whose event mappings can fire before their room has loaded, a start-room cutscene without `waitForEvent`, an NPC-held note whose `onRead` sets a gating global, missing or legacy sprite art, one sprite sheet shared by different characters, pinned objects inside one interaction range, a timed text repeated in the ink it opens, ink `VAR`s read but never set, `#set_global` names missing from `globalVariables`, timed texts that stack (under 4 s apart), globals set but never read, and credit sections whose entries are all conditional
4. **Recommended fields** – warnings for missing `globalVariables`, `objectives`, `observations`, NPC `position`, `currentKnot`, etc.
5. **Suggestions** – guidance for adding VM launchers, flag stations, opening cutscenes, closing debriefs, patrol NPCs, and variety in lock types

### Exit codes

| Code | Meaning |
|------|---------|
| `0`  | Validation passed (suggestions and warnings do not cause failure) |
| `1`  | Schema validation failed or unrecoverable error |

---

## Scenario Structure Constraints

### Basic Structure
- Each scenario must have a `scenario_brief` that explains the mission
- Each scenario must define a top-level `startRoom` field (not nested under `player`) naming the room where the player begins
- Optionally set a top-level `startPosition` (tile coordinates) to spawn the player at a specific location within `startRoom`. If omitted the player is placed at the room centre:
  ```json
  "startRoom": "ward_7",
  "startPosition": { "x": 17, "y": 9 }
  ```
- Some scenarios include an `endGoal` property
- All scenarios must have a `rooms` object containing individual room definitions

### Room Connections

Rooms can connect in **four directions**: `north`, `south`, `east`, `west`

**Connection Syntax**:
```json
"connections": {
  "north": "office1",           // Single connection
  "south": ["reception", "hall"], // Multiple connections (array)
  "east": "serverroom",
  "west": ["closet1", "closet2"]
}
```

**Key Points**:
- All directions support both single connections (string) and multiple connections (array)
- The room layout algorithm positions rooms using breadth-first traversal
- Multiple rooms in the same direction are positioned side-by-side (N/S) or stacked (E/W)
- All rooms align to grid boundaries for consistent door placement

#### Door Validation and Locking

The code in `validateDoorsByRoomOverlap()` (lines 3236-3323) shows that:

1. Doors must connect exactly two rooms (line 3281)
2. If a door connects to a locked room, the door inherits the lock properties (lines 3296-3303)
3. Doors that don't connect exactly two rooms are removed (lines 3281-3291)

#### Designing Solvable Scenarios with the Grid System

The grid-based room layout system provides significant flexibility for scenario design:

1. **Flexible Layout Patterns**: Design scenarios using any combination of directions:
   - **Vertical**: Stack rooms north/south for traditional layouts
   - **Horizontal**: Connect rooms east/west for wide facilities
   - **Mixed**: Combine directions for complex, non-linear layouts
   - **Branching**: All directions support multiple connections

2. **Room Size Variety**: Mix different room sizes for visual interest and gameplay:
   - Use **1×1 GU closets** for small offices, storage rooms, or utility spaces
   - Use **2×2 GU standard rooms** for open plan offices, reception areas
   - Use **1×2 GU or 4×1 GU halls** to connect distant areas
   - Ensure all room dimensions follow the valid size formula

3. **Lock Progression**: Design logical progression through the facility:
   - Place keys, codes, and unlock items in accessible rooms first
   - Create puzzles that require backtracking or exploring side rooms
   - Use east/west connections for optional areas with bonus items
   - Layer security with multiple lock types (key → PIN → biometric)

4. **Connection Planning**:
   - Start by sketching your layout on grid paper (5-tile width increments)
   - Ensure all rooms are reachable from the starting room
   - Verify room dimensions before creating Tiled maps
   - Test door alignment between connected rooms

5. **Avoid Common Pitfalls**:
   - **Invalid heights**: Heights of 7, 8, 9, 11, 12, 13 will cause issues
   - **Room overlaps**: System validates and warns, but plan carefully
   - **Disconnected rooms**: Ensure all rooms connect to the starting room
   - **Asymmetric connections**: When connecting single-door to multi-door rooms, the system handles alignment automatically

#### Example Layout Structures

**Vertical Tower** (traditional):
```
        [Server Room]
             ↑
        [CEO Office]
             ↑
    [Office1] [Office2]
         ↑       ↑
        [Reception]
```

**Horizontal Facility** (wide):
```
[Closet1] ← [Office] → [Meeting] → [Server]
                ↑
           [Reception]
```

**Complex Multi-Direction**:
```
    [Storage]   [CEO]
        ↑         ↑
    [Closet] ← [Office] → [Server]
                  ↑
             [Reception]
```

**With Hallways**:
```
    [Office1]  [Office2]
        ↑          ↑
    [---- Hall ----]
           ↑
      [Reception]
```

These layouts demonstrate the flexibility of the new grid system for creating engaging, solvable scenarios.


### Top-Level Optional Scenario Properties

| Property | Description |
|---------|-------------|
| `globalVariables` | Key/value map of all game state variables. Required for Ink dialogue, event-driven logic, and objective tracking. |
| `player` | Player sprite configuration: `id`, `displayName`, `spriteSheet`, `spriteTalk`, `spriteConfig` |
| `narrator` | Defines a narrator voice used for cutscenes. Include `id`, optional `skipTextValidation: true`, and a `voice` object. |
| `objectives` | Array of objective `aims`, each containing `tasks`. Drives the objectives HUD. |
| `startItemsInInventory` | Array of items the player starts with (e.g., a phone, lockpick, workstation). |
| `flags` | Map of VM flag arrays by VM name. Populated via ERB helper `vm_flags_json('vm_name')`. |
| `show_scenario_brief` | When to pop up the brief: `"on_start"` (every load), `"on_resume"` (only when resuming a game with progress), `"once"` (first start only, after any opening cutscene; recorded in the save so a reload doesn't reopen it), or omit (as `"on_start"`). The brief is always in the Notepad. |
| `disableAttacks` | `true` turns off player attacks: no punching, no Interact/Jab/Cross toggle in the HUD (Q does nothing), and no combat step in the tutorial. NPCs can't be knocked out, so the validator skips its KO-resilience check. Used by the SIS serious games. |
| `creditsTheme` | Theme of the end-of-mission credits visualiser, from the table in `public/break_escape/js/music/credits-theme.js`. `"safetynet"` (the default when omitted) is the SAFETYNET campaign debrief: classified stamp, global threat map, agency panel, S/N shield, track title. `"cyber"` is a generic cyber security incident review for standalone exercises such as the SIS games: "INCIDENT REVIEW", the mission's display name, the first `subtitle` credit line as the setting, a review log that echoes the credits, a padlock logo, SIEM and matrix modes but no threat map or stamps, and "MUSIC: CLOSING THEME" instead of the track title. Each theme lists which visualiser modes it enables. |
| `gameClock` | Optional in-game time: `{ "start": "Tue 07:30" }`. The command board and SIEM clocks show the start plus elapsed game time instead of the real wall clock, and board entries are stamped with it. Game time (and every scenario timer) resumes after a reload. |
| `music` | Dynamic music event system. See Music System section. |

### Available Room Types

The `type` field of each room must match a file in `public/break_escape/assets/rooms/`. Available types:

| Room Type | Description |
|-----------|-------------|
| `room_reception` | Reception area (standard 2×2 GU) |
| `room_office` | Open-plan office (standard 2×2 GU) |
| `room_ceo` | Executive office |
| `room_meeting` | Meeting / conference room |
| `room_break` | Break room |
| `room_closet` | Storage closet |
| `room_servers` | Server room |
| `room_it` | IT department |
| `room_archive_1x2gu` | Evidence archive / document storage room (1×2 GU) |
| `room_library_1x2gu` | Library / reading room (1×2 GU) |
| `room_control_1x2gu` | SCADA / industrial control room (1×2 GU) |
| `room_battery_hall` | Industrial lithium-ion battery storage hall (4×2 GU) |
| `room_hospital_ward` | Hospital ward (4×2 GU) |
| `room_hospital_reception` | Hospital reception / night desk (2×2 GU) |
| `room_hospital_office` | Hospital office — generic two-desk admin office (2×2 GU) |
| `room_hospital_office_it` | Hospital IT department (2×2 GU) — two-desk bank, repair workbench, comms rack, locked filing cabinet |
| `room_hospital_office_cto` | Hospital executive office (2×2 GU) — one wooden desk with visitor chairs, bookcases, small meeting table, wall safe |
| `room_hospital_office_security` | Hospital security office (2×2 GU) — CCTV console desk, key cabinet, radio charger, lockers |
| `room_hospital_cto_office` | Hospital executive office (1×1 GU) |
| `room_hospital_meeting` | Hospital boardroom / meeting room (2×2 GU) |
| `room_hospital_servers` | Hospital server room (2×2 GU) |
| `room_hospital_hall` | Hospital corridor (2×1 GU) — clinical room_hospital tiles, baked-in south wall for a standalone through-hallway |
| `room_hospital_hall_ward` | Hospital corridor variant (2×1 GU) — parked trolley bed, IV pump, nurse-call panel; same slots as `room_hospital_hall` |
| `room_hospital_hall_waiting` | Hospital corridor variant (2×1 GU) — row of waiting seats; same slots as `room_hospital_hall` |
| `room_hospital_waiting_1x1gu` | Small hospital waiting area / vestibule (1×1 GU) — seats along both side walls, side doors on row 2; no scenario slots |
| `room_hospital_storage_1x1gu` | Small hospital store room (1×1 GU) — drugs cabinet, crash cart, boxed supplies; slots: floor `safe`, wall `notes` |
| `small_office_room1_1x1gu` | Small private office (1×1 GU) |
| `small_office_room2_1x1gu` | Small private office variant 2 |
| `small_office_room3_1x1gu` | Small private office variant 3 |
| `small_room_1x1gu` | Generic small room (1×1 GU) |
| `small_room_storage_1x1gu` | Small storage room (1×1 GU) |
| `small_room_closet_east_connections_only_1x1gu` | Small closet (east connections only) |
| `hall_1x2gu` | Vertical hallway (1×2 GU) |
| `hall4x10` | Wide horizontal hall (4×10 tiles) |

> **Wall tile convention:** Each room tile map includes 1 tile of wall on the E and W sides and 2 tiles of wall on the N side (drawn in perspective). The 2-tile north wall visually overlaps into the room above when rooms are placed adjacent — this is intentional and expected. GU dimensions are measured on total width (1 GU = 5 tiles) and interior height excluding the 2 N wall tiles (1 GU = 4 interior tiles).

### Room Properties

```json
"room_id": {
  "type": "room_office",
  "locked": true,
  "lockType": "key",
  "requires": "main_office_key",
  "keyPins": [45, 25, 55, 35],
  "difficulty": "medium",
  "door_sign": "Main Office",
  "ambientSound": "server_room_ventilation",
  "ambientVolume": 0.4,
  "connections": { "north": "next_room" },
  "npcs": [...],
  "objects": [...]
}
```

All room lock properties are the same as object lock properties (see Lock Types below).

### Starting Inventory

Use the `startItemsInInventory` array at scenario root level. Players have these items automatically at game start:

```json
"startItemsInInventory": [
  {
    "type": "phone",
    "name": "Your Phone",
    "takeable": true,
    "phoneId": "player_phone",
    "npcIds": ["agent_0x99"],
    "observations": "Your secure encrypted phone"
  },
  {
    "type": "workstation",
    "name": "CyberChef Workstation",
    "takeable": true,
    "observations": "A crypto analysis tool"
  }
]
```

---

## Object Reference

### Object Placement and Positioning

Each room type has a Tiled map template (`.tmj`) that pre-defines positions for certain object types. When the engine loads a room, it matches each object from the scenario's `objects` array against available slots in that template:

- **Matched objects** are placed at the position defined in the Tiled template (correct furniture placement, on desks, shelves, etc.)
- **Unmatched objects** — those whose `type` has no available slot left in the template — are placed at a **random position** within the room bounds (with padding from walls)

This means you can place any number of objects in a room, but only objects that correspond to pre-placed items in the room template will appear in their intended position. Extra objects of the same type, or types not present in the template, will be scattered randomly. Keep this in mind when designing room contents — using object types that the room template already contains gives predictable, visually coherent results.

Every object in `rooms[id].objects[]`, in NPC `itemsHeld[]`, in container `contents[]`, or in `startItemsInInventory[]` uses these common fields:

### The `type` Field: Default Behaviors and Overrides

The `type` field is the most important object property. By default, it controls three aspects of object behavior:

1. **Interaction Behavior** — The type determines which minigame or interaction handler fires when the player clicks the object:
   - `"type": "pc"` → triggers password minigame
   - `"type": "alarm_panel"` → opens alarm panel minigame
   - `"type": "network_architecture"` → launches network architecture diagram
   - Override with `triggerOnInteract` to execute custom actions instead of the default minigame

2. **Placement** — Objects are matched to pre-positioned slots in the room's Tiled template (`.tmj` file):
   - Objects with types that exist in the template are placed at the template position
   - Objects without template matches are placed randomly within room bounds
   - Override with `"position": { "x": 12, "y": 8 }` to specify exact tile coordinates
   - Override with `"position": "as-type:pc"` to use placement slots of a different type (e.g., place a laptop in a PC slot)

3. **Sprite** — The type determines which sprite image is loaded from `assets/objects/`:
   - `"type": "pc"` → loads `pc.png`, `pc1.png`, `pc2.png`, etc. (random variant)
   - `"type": "safe"` → loads `safe.png`, `safe1.png`, etc.
   - Override with `"sprite": "pc3"` to force a specific sprite variant

**Example: Full override**
```json
{
  "type": "pc",
  "name": "Offline Workstation",
  "takeable": false,
  "observations": "A disconnected workstation used for data analysis.",
  "sprite": "pc5",
  "position": { "x": 14, "y": 6 },
  "triggerOnInteract": [
    { "type": "set_global", "key": "workstation_examined", "value": true }
  ]
}
```
This object uses the `pc` type but overrides all three defaults: custom sprite (`pc5`), exact position (`14, 6`), and custom interaction (sets variable instead of password minigame).

**Example: Using another type's placement slots**
```json
{
  "type": "laptop",
  "name": "Engineering Laptop",
  "takeable": false,
  "position": "as-type:pc",
  "observations": "A laptop containing engineering documentation."
}
```
This laptop object will be placed at the next available `pc` slot in the room template, even though its type is `laptop`. Useful when the room has placement slots for PCs but not laptops, allowing you to place laptop objects at desk positions without specifying exact coordinates.

### Object Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `type` | ✅ | Object type name. Controls default minigame, placement, and sprite (see above) |
| `sprite` | optional | Override the sprite variant (e.g. `"pc3"` to force that specific sprite instead of random selection) |
| `position` | optional | Override template placement. Use `{ "x": 12, "y": 8 }` for exact tile coordinates, or `"as-type:pc"` to use placement slots of a different type |
| `name` | ✅ | Display name shown in UI |
| `takeable` | ✅ | `true` = player can pick up; `false` = stays in room |
| `observations` | recommended | Description shown when player examines the object |
| `observationVariants` | optional | Runtime observation overrides. Array of `{ "condition": "globalVars...", "value": "..." }` evaluated top-to-bottom; first match wins. |
| `id` | optional | Explicit ID for cross-referencing in objectives (`targetObject`) |
| `locked` | required for containers | Must be `true` or `false` on any container with `contents` |
| `readable` | optional | `true` enables the "Read" interaction |
| `text` | optional | Body text shown when the player reads the item |
| `textVariants` | optional | Runtime readable-text overrides. Same format/rules as `observationVariants`; first matching condition is used. |
| `collection_group` | optional | Tag used for objective `collect_items` task tracking |
| `important` | optional | `true` marks item as important in inventory |
| `isEndGoal` | optional | `true` marks item as the scenario's win condition |
| `triggerOnInteract` | optional | Array of actions fired on interaction. Overrides default type-based minigame behavior. See "Object Interaction Actions" below. |
| `observationDisplay` | optional | `"gameDisplay"` for a modal observation display. Omit it and a text-only object opens the examine view (see "Observation Display Mode") |
| `onRead` | optional | `{ "setVariable": { "var_name": true } }` — sets a global variable on read |
| `onPickup` | optional | `{ "setVariable": { "var_name": true } }` — sets a global variable on pickup |
| `onInteract` | deprecated | Legacy interaction handler. Use `triggerOnInteract` + `observationDisplay` instead. |
| `minigameData` | optional | Configuration object for interactive minigames. All minigame-specific configuration goes here, not at the object level. See Minigame Configuration below. |

Example (dynamic bedside monitor copy):

```json
{
  "type": "vitals-monitor",
  "name": "Bed 4 — Bedside Monitor",
  "readable": true,
  "observations": "Monitor alarming.",
  "observationVariants": [
    { "condition": "globalVars.patient_bed4_state === 'critical'", "value": "Monitor in critical alarm state." },
    { "condition": "globalVars.patient_bed4_deceased", "value": "No detectable rhythm." }
  ],
  "text": "Baseline bedside readings.",
  "textVariants": [
    { "condition": "globalVars.patient_bed4_state === 'distressed'", "value": "Escalating abnormal readings." }
  ]
}
```

### Lock Types

Applies to both rooms and objects (safes, PCs, briefcases, doors, etc.):

| `lockType` | `requires` value | Notes |
|-----------|-----------------|-------|
| `key` | a string naming this lock, matched against a key item's `opens_lock` | Also requires `keyPins` array on **both** the lock and the matching key item (e.g., `[45, 25, 55, 35]`) |
| `pin` | 4-digit PIN string (e.g., `"2468"`) | Player enters PIN in numeric keypad mini-game |
| `password` | Password string (e.g., `"Marketing123"`) | Player types password; `showKeyboard: true` shows on-screen keys; `maxAttempts: 3` limits tries; `postitNote` + `showPostit: true` shows a hint post-it |
| `rfid` | a string naming this lock, matched against a keycard's `card_id` or `opens_lock` | Player must scan a keycard using the `rfid_cloner` or by carrying the card |
| `bluetooth` | Bluetooth device MAC address | Requires `bluetooth_scanner` tool; device must be discovered |
| `biometric` | Fingerprint owner name | Requires `fingerprint_kit`; `biometricMatchThreshold` (0.0–1.0) sets difficulty |
| `flag` | `"vm_name:flag_id"` string | Unlocked by submitting a VM flag at a `flag-station`; supports `flagRewards` array |

```json
"locked": true,
"lockType": "key",
"requires": "derek_office_key",
"keyPins": [35, 55, 45, 25],
"difficulty": "medium"
```

### Minigame Configuration

Many interactive objects use minigames with configurable content and behaviour. All minigame-specific configuration is placed in a `minigameData` object, separate from the object's base properties.

**Important**: Object-level fields (`id`, `type`, `name`, `interactable`, `takeable`, `locked`, etc.) remain at the top level. Minigame-specific configuration (titles, sections, lamps, racks, warranties, etc.) goes inside `minigameData`.

Each minigame type has a defined schema in `scripts/minigame-data-schemas.json` that specifies which fields are required and optional. The scenario validator checks all `minigameData` against these schemas.

#### Example: Claims Management System

```json
{
  "id": "claims_management_system",
  "type": "pc",
  "name": "Claims Management System Terminal",
  "takeable": false,
  "observations": "Meridian's internal claims lifecycle terminal.",
  "minigameData": {
    "title": "Meridian Claims Management System",
    "printEnabled": true,
    "stateWrites": {
      "policy": "cms_policy_section_reviewed",
      "quarterly": "quarterly_reports_reviewed"
    },
    "sections": [
      {
        "id": "claim",
        "label": "Claim Record",
        "heading": "Albion Incident Notification",
        "status": "Open - Pending Review",
        "content": ["Notification filed by...", "Event classification..."]
      }
    ]
  }
}
```

#### Example: Alarm Panel

```json
{
  "type": "alarm_panel",
  "name": "Facility Alarm Panel",
  "takeable": false,
  "observations": "A wall-mounted alarm panel.",
  "minigameData": {
    "panelTitle": "FACILITY ALARM PANEL",
    "footer": "STATE-REACTIVE LAMP DISPLAY — READ ONLY",
    "lamps": [
      {
        "label": "THERMAL RUNAWAY",
        "variable": "thermal_runaway_active",
        "offClass": "ap-off",
        "offStatus": "NORMAL",
        "onClass": "ap-critical",
        "onStatus": "CRITICAL ALARM",
        "flash": true
      }
    ]
  }
}
```

#### Example: SCADA Historian

```json
{
  "type": "scada_historian",
  "name": "SCADA Historian Terminal",
  "takeable": false,
  "minigameData": {
    "title": "ALBION ENERGY STORAGE — SCADA HISTORIAN",
    "subtitle": "Battery Hall 1 — Temperature (°C)",
    "injectionTimestamp": "2024-03-17T23:12:00Z",
    "injectedValue": 28.0,
    "racks": [
      {
        "id": "A1",
        "normalBase": 32,
        "noisePeriodMinutes": 15,
        "noiseAmplitude": 2.5
      }
    ]
  }
}
```

#### Common Minigame Types

| Object Type | Minigame | Key `minigameData` Fields |
|-------------|----------|--------------------------|
| `alarm_panel` | Alarm Panel | `lamps[]`, `panelTitle`, `footer` |
| `scada_historian` | SCADA Historian | `racks[]`, `title`, `injectionTimestamp`, `injectedValue` |
| `log_filter_terminal` | Log Filter | `logEntries[]`, `anomaly`, `threatIntel` |
| `vpn_log_terminal` | VPN Log Viewer | `anomaly`, `logFilePath`, `threatIntel` |
| `siem_dashboard` | SIEM Dashboard | `alertConfig`, `systemName`, `timeLimitSec` |
| `network_architecture` | Network Architecture | `zones[]`, `nodes[]`, `attackPaths[]` |
| `network-segmentation-map` | Network Segmentation | `zones[]`, `rules[]`, `auth` |
| `forensic_data_platform` | Forensic Data Platform | `tabSet`, `caseRef`, `confirmedVar` |
| `claims_management_system` | Claims Management | `sections[]`, `stateWrites`, `printEnabled` |
| `checklist` | Warranty Checklist | `warranties[]`, `title` |
| `coverage_decision_form` | Coverage Decision | `sections[]`, `completionActions` |
| `sis_config_panel` | SIS Config Threshold | `rows[]`, `title`, `compareTitle` |
| `infusion_pump` | Infusion Pump | `drug_name`, `correct_dose` |
| `drug_library_terminal` | Drug Library | `drugLibrary`, `tamperedEntry` |
| `ncsc_brief` | NCSC Brief | `reviewedVar`, `caseRef`, `sections[]` |
| `ehr_terminal` | EHR Terminal | `patients[]`, `customMessage` |

**Validation**: Run `ruby scripts/validate_scenario.rb` to check minigameData against schemas. The validator will report any undeclared fields or missing required fields.

### Object Interaction Actions

Objects can execute actions when the player interacts with them using `triggerOnInteract`. This system supports setting variables, confirming actions, unlocking objects, completing tasks, and more.

**Important**: Use `triggerOnInteract` (not the deprecated `onInteract`) for all interaction-based actions.

#### Basic Usage

```json
{
  "type": "thermometer",
  "name": "Analog Thermometer",
  "takeable": false,
  "observations": "The dial reads: 51°C",
  "triggerOnInteract": [
    { "type": "set_global", "key": "anomaly_detected", "value": true }
  ]
}
```

#### Confirmation Dialog

Use `confirm_action` to require player confirmation before executing actions:

```json
{
  "type": "cable",
  "name": "Jump Server Ethernet Cable",
  "takeable": false,
  "observations": "The cable connecting the jump server to the SCADA network.",
  "triggerOnInteract": [
    {
      "type": "confirm_action",
      "text": "Disconnect cable JS-SCADA-LAN?",
      "onConfirm": [
        { "type": "set_global", "key": "jump_server_isolated", "value": true }
      ]
    }
  ]
}
```

#### Observation Display Mode

Control how observation text is displayed using `observationDisplay`:

```json
{
  "type": "screens",
  "name": "Facility Status Board",
  "takeable": false,
  "observations": "A large wall-mounted display mirroring the SCADA HMI. All battery halls showing green. Temperature: 28°C. Status: NORMAL.",
  "observationDisplay": "gameDisplay"
}
```

**Display modes**:
- `"gameDisplay"` - Full-screen modal dialog requiring player to click "Close" (use for critical information that must be read)
- Default (omit field) - The **examine view** for text-only objects: the sprite at twice its size in the room (a whole-number multiple of its pixels, at least 4x), the name, then `observations` and `text`, closed with Close or Esc. It opens for a room object that is not takeable, locked, readable-with-text or otherwise actionable, and has `observations` or `text`; and for any inventory item whose click does nothing else (a single key included; the key ring, phones, notepads, readable items and tools keep their own action). An object with no `observations` or `text` still gets the old toast.

#### Supported Action Types

| Action Type | Fields | Description |
|-------------|--------|-------------|
| `set_global` | `key`, `value` | Sets a global variable |
| `emit_event` | `event_name` | Fires a custom event |
| `complete_task` | `taskId` | Marks an objective task complete |
| `unlock_object` | `objectId` | Unlocks a world object |
| `unlock_door` | `room_id` | Unlocks a door connection |
| `give_item` | `item` | Adds an item to inventory |
| `confirm_action` | `text`, `onConfirm` | Shows confirmation dialog, executes nested actions on confirm |
| `tint_objects` | `roomId`, `textureKey`, `color`, `pulse` | Tints all sprites of a type in a room |
| `show_end_screen` | `title`, `body`, `buttonText`, `outcome` | Shows scenario end screen |

**Note**: The deprecated `onInteract` field (object format) is still functional but will log warnings. Migrate to `triggerOnInteract` + `observationDisplay` for new scenarios.

### Container Objects

Containers hold `contents` arrays of nested items. Every container with `contents` **must** declare `locked: true` or `locked: false`.

| Type | Notes |
|------|-------|
| `safe` (variants: `safe1`–`safe5`) | In-room safe; common PIN or password lock |
| `suitcase` (variants: `suitcase1`–`suitcase21`, colour variants) | Briefcase/luggage; common key lock |
| `briefcase` (variants: `briefcase1`–`briefcase13`, colour variants) | Briefcase; common key lock |
| `bag` (variants: `bag1`–`bag25`) | Bag/backpack |
| `bin` / `bin1`–`bin11` | Recycling/waste bin (often `locked: false` with hidden clue items inside) |
| `pc` (variants: `pc1`–`pc12`) | Computer terminal; supports `lockType: "password"`, `postitNote`, `showPostit`, `maxAttempts` |
| `filing_cabinet` | Filing cabinet |

#### PC-specific properties

```json
{
  "type": "pc",
  "name": "Derek's Computer",
  "takeable": false,
  "locked": true,
  "lockType": "password",
  "requires": "Anniversary",
  "postitNote": "Think: important dates",
  "showPostit": true,
  "maxAttempts": 3,
  "showKeyboard": true,
  "observations": "A password-locked workstation",
  "contents": [
    { "type": "text_file", "name": "Access Log", "readable": true, "text": "..." }
  ]
}
```

### Readable / Document Objects

| Type | Notes |
|------|-------|
| `notes` (also `notes1`–`notes5`) | Loose notes / paper; `notes2`–`notes5` use different coloured sprites — handy for colour-coding evidence tiers |
| `text_file` | Digital file found inside a PC container |
| `phone` | Desk phone / answerphone — supports `voice` (TTS script), `ttsVoice`, `avatar`, `sender`, `timestamp` for voicemail presentation |
| `tablet` | Tablet device |
| `smartscreen` | Wall-mounted display |

#### Phone / voicemail object

```json
{
  "type": "phone",
  "id": "reception_desk_phone",
  "name": "Reception Desk Phone",
  "phoneId": "reception_desk_phone",
  "takeable": false,
  "readable": true,
  "voice": "Hi Sarah, it's Kevin. The IT room PIN is 2468.",
  "ttsVoice": { "name": "Charon", "style": "Nerdy Australian IT guy", "language": "en-GB" },
  "avatar": "assets/characters/male_nerd_headshot.png",
  "sender": "Kevin Park (IT)",
  "timestamp": "Yesterday, 6:47 PM",
  "observations": "The message light is blinking"
}
```

### Key & Access Items

These items are carried in the player's inventory to unlock doors, containers, or systems.

| Type | Notes |
|------|-------|
| `key` | Physical key. Must have `opens_lock` and `keyPins` array. |
| `keycard` | RFID keycard. Must have `opens_lock` (or `card_id`). Variants: `keycard-ceo`, `keycard-maintenance`, `keycard-security`. |
| `id_badge` | Visitor or staff badge (narrative/inventory item). |
| `key-ring` | Decorative key-ring item. |

#### Item identity: `type`, `id`, `opens_lock`

Three fields, three jobs. Keeping them apart is what stops a mapping silently never firing.

| Field | Answers | Notes |
|---|---|---|
| `type` | *What class of thing is it?* | Shared by many items (`notes`, `lab-workstation`, `key`). Picks the sprite, and `#give_item:<type>` matches on it. `item_picked_up:<type>` is emitted with the **type**, never the id. |
| `id` | *Which object is this?* | Unique. The `#give_item` selector, `data.itemId` on pickup events, and inventory de-duplication all use it. Give every item an `id` when its NPC or room holds more than one of a type. |
| `opens_lock` | *Which lock does it open?* | Only on things that open something. **Many-to-one**: two spare keys to the same door share one `opens_lock` and keep distinct `id`s. Matched against a lock's `requires`. |

Common mistakes the validator now catches:

- `key_id` in a scenario — renamed to `opens_lock`. Both sides still read it **only** so missions started before the rename can finish; a game snapshots its `scenario_data` at creation. The fallback lives in exactly two places: `window.lockRef` (`js/utils/helpers.js`) on the client and `BreakEscape::ItemIdentity` (`lib/break_escape/item_identity.rb`) on the server. Never quiet a validator error by leaning on either.
- Remember the server half. A key unlock is validated by Rails against the lock's `requires`, so a key that reaches the inventory without an `opens_lock` the server can see will fail at the door even though the client looked happy.
- An `opens_lock` no lock `requires` — a typo, or an identity that belongs in `id`.
- A key lock nothing can open.
- An `item_picked_up:` mapping keyed on an id — the event carries the **type**. Disambiguate with `"condition": "data.itemId === '<id>'"`.


```json
{
  "type": "key",
  "name": "Derek's Office Key",
  "takeable": true,
  "opens_lock": "derek_office_key",
  "keyPins": [35, 55, 45, 25],
  "observations": "Spare key to Derek Lawson's office"
}
```

### Security Tools

Security tools enable specific mini-games and unlock mechanics. Can be placed as room objects or in NPC `itemsHeld`.

| Type | Mini-game / Effect |
|------|-------------------|
| `lockpick` | Enables lockpicking mini-game on `lockType: "key"` locks |
| `fingerprint_kit` | Enables fingerprint collection from objects with `hasFingerprint`; required for biometric locks |
| `pin-cracker` / `pin-cracker-large` | Enables PIN-cracking mini-game on `lockType: "pin"` locks |
| `bluetooth_scanner` | Enables Bluetooth scanning to discover devices for `lockType: "bluetooth"` locks |
| `rfid_cloner` | Enables RFID cloning from keycards for `lockType: "rfid"` locks |
| `workstation` | Opens embedded CyberChef cryptography tool (browser-based) |

### Hacking / VM Objects

| Type | Notes |
|------|-------|
| `vm-launcher` (variants: `vm-launcher-kali`, `vm-launcher-desktop`) | Opens a VM terminal (Hacktivity mode) or a simulated interface. Requires `vm` (ERB: `<%= vm_object('vm_name', fallback) %>`), `hacktivityMode`, and `id`. |
| `flag-station` | Flag submission terminal. Accepts flags from specified VMs (`acceptsVms`), validates against `flags` array (ERB: `<%= flags_for_vm('vm_name') %>`), and fires `flagRewards` actions on success. |
| `launch-device` | High-stakes interactive device for mission climax. Full required fields: `mode` (`"launch-abort"`), `acceptsVms`, `flags`, `flagRewards`, `onAbort`, `onLaunch`, `abortConfirmText`, `launchConfirmText`. |

#### vm-launcher example

```json
{
  "type": "vm-launcher",
  "id": "vm_launcher_kali",
  "name": "Kali Terminal",
  "sprite": "vm-launcher-kali",
  "takeable": false,
  "observations": "A Kali Linux attack terminal",
  "hacktivityMode": <%= vm_context && vm_context['hacktivity_mode'] ? 'true' : 'false' %>,
  "vm": <%= vm_object('intro_to_linux_security_lab', {"id":1,"ip":"192.168.100.50"}) %>
}
```

#### flag-station example

```json
{
  "type": "flag-station",
  "id": "flag_station_1",
  "name": "SAFETYNET Terminal",
  "takeable": false,
  "observations": "Secure terminal for submitting flags",
  "acceptsVms": ["desktop"],
  "flags": <%= flags_for_vm('desktop') %>,
  "flagRewards": [
    { "type": "set_global", "key": "linux_flag_submitted", "value": true }
  ]
}
```

#### launch-device example (see `scenarios/m01_first_contact/scenario.json.erb` for full reference)

```json
{
  "type": "launch-device",
  "name": "ENTROPY Launch Device",
  "takeable": true,
  "mode": "launch-abort",
  "acceptsVms": ["desktop"],
  "flags": ["desktop:flag_3"],
  "flagRewards": [{ "type": "set_global", "key": "launch_code_submitted", "value": true }],
  "onAbort": { "setGlobal": { "player_aborted_attack": true }, "emitEvent": "attack_aborted" },
  "onLaunch": { "setGlobal": { "player_launched_attack": true }, "emitEvent": "attack_launched" },
  "abortConfirmText": "ABORT OPERATION? This cannot be undone.",
  "launchConfirmText": "EXECUTE OPERATION? This cannot be undone."
}
```

### Decorative / Environment Objects

These objects have no special gameplay function but improve immersion. They use `takeable: false` and `observations`.

The `type` value must match a sprite filename (without extension) in `public/break_escape/assets/objects/`. Variants with an integer suffix are valid types — e.g. `notes`, `notes2`, `notes3` are all distinct sprite files and all valid `type` values.

| Category | Types |
|----------|-------|
| Office misc | `chalkboard`, `chair-*` (many variants), `sofa1`, `laptop1`–`laptop7`, `keyboard1`–`keyboard8`, `tablet`, `smartscreen` |
| Plants | `plant-large1`–`plant-large13`, `plant-flat-pot1`–`plant-flat-pot7`, `plant-large-displacement` |
| Pictures / decor | `picture1`–`picture14`, `lamp-stand1`–`lamp-stand5`, `outdoor-lamp1`–`outdoor-lamp4` |
| Server room | `servers`, `servers2`–`servers4` |
| Loot / ambience | `office-misc-*` (pencils, pens, stapler, clock, fan, hdd, headphones, lamp, speakers, plants, etc.) |
| Other | `book1`, `bookcase`, `spooky-candles`, `spooky-splatter`, `torch-1`, `torch-left`, `torch-right` |

---

## NPC System

NPCs are defined in `rooms[id].npcs[]` arrays. Two NPC types exist:

### Person NPCs (`npcType: "person"`)

In-world characters with sprites that the player can walk up to and interact with.

```json
{
  "id": "kevin_park",
  "displayName": "Kevin Park",
  "npcType": "person",
  "position": { "x": 4, "y": 4 },
  "spriteSheet": "male_nerd",
  "spriteTalk": "assets/characters/male_nerd_talk.png",
  "spriteConfig": { "idleFrameRate": 6, "walkFrameRate": 10 },
  "storyPath": "scenarios/my_scenario/ink/npc_kevin.json",
  "currentKnot": "start",
  "voice": { "name": "Charon", "style": "Nerdy Australian", "language": "en-GB" },
  "globalVarOnKO": "kevin_ko",
  "taskOnKO": "meet_kevin",
  "behavior": {
    "hostile": { "chaseSpeed": 145, "attackDamage": 15, "pauseToAttack": false },
    "patrol": { "waypoints": [{"x": 2, "y": 2}, {"x": 6, "y": 4}] },
    "initiallyHidden": false
  },
  "itemsHeld": [
    { "type": "lockpick", "name": "Lock Pick Kit", "takeable": true, "observations": "..." }
  ]
}
```

**Key person NPC fields:**

| Field | Description |
|-------|-------------|
| `position` | `{ "x": tiles_from_left, "y": tiles_from_top }`. Omit only if `behavior.initiallyHidden: true`. |
| `spriteSheet` | Character sprite name (see `public/break_escape/assets/characters/`) |
| `spriteTalk` | Portrait image for dialogue box. Optional — defaults to `assets/characters/{spriteSheet}_talk.png`, then `{spriteSheet}_headshot.png`. Only set it for off-convention filenames. |
| `spriteVisemes` | Optional lip-sync portrait: `assets/characters/<key>_visemes.png` (one row of 128px mouth-shape cells) with `<key>_visemes.json` beside it naming each column. While TTS plays, mouth shapes follow the line's text; falls back to `spriteTalk` if absent or unloadable. See `docs/SPRITE_SYSTEM.md`. |
| `storyPath` | Path to compiled Ink `.json` story file |
| `currentKnot` | Starting Ink knot (usually `"start"`) |
| `voice` | TTS voice for dialogue and barks: `{ "name": "...", "style": "...", "language": "en-GB" }`. Optional `fx` subfield applies Web Audio distortion — see Casting Voices and Voice FX below |
| `globalVarOnKO` | Global variable name to set `true` when NPC is knocked out |
| `taskOnKO` | Task ID to complete when NPC is knocked out |
| `itemsHeld` | Items dropped when NPC is knocked out. Give an item an `id` when the NPC holds more than one of the same `type` — `#give_item` matches on `type` first, then disambiguates against `id`/`opens_lock`/`name`, and with no `id` the first matching item always wins. |
| `behavior.hostile` | Makes NPC chase and attack. Fields: `chaseSpeed`, `attackDamage`, `pauseToAttack` |
| `behavior.patrol` | Patrol configuration (see Patrol Behaviour below) |
| `behavior.immovable` | `true` — NPC cannot be pushed or displaced by collisions (e.g. a patient in a bed) |
| `behavior.initiallyHidden` | `true` hides NPC at spawn — use `setVisible` in an event mapping to reveal them later |

#### Casting voices

`voice.name` is a Gemini prebuilt voice; `voice.style` is a free-text prompt the TTS acts on. Nothing validates either field, so both drift easily.

- **Give every speaking NPC a voice.** An NPC with no `voice` block is silent while everyone around them is not, which reads as a bug. Terminals and computer-driven phone NPCs are the legitimate exception.
- **Don't reuse one `name` across characters who appear together.** The `style` prompt differentiates them somewhat, but two characters in adjacent rooms sharing a voice sounds like one actor doing both. Reuse is correct only for the *same* character across multiple NPC entries (a handler who appears as a briefing cutscene, a phone contact, and a debrief).
- **Name the accent explicitly and say "consistent … throughout".** Without it the model drifts mid-line. "British" is not an instruction; "consistent Belfast accent throughout" is.
- **Write the style as a character brief, not adjectives.** Role, age, what the night has done to them, and how they speak under pressure. `"Ward sister, twenty years on the wards. Consistent Belfast accent throughout. Exhausted, dry, unsentimental about everything except her patients. Never raises her voice."` gives the model far more to work with than `"tired nurse"`.
- **Spread the accents.** A cast that is uniformly RP sounds like one institution's senior management, not a hospital at four in the morning. Mix regional British (Scouse, Brummie, Yorkshire, Belfast, Estuary, MLE) with international where the character's history supports it, and let a character's accent carry their biography rather than decorating it.

#### Voice FX (distortion / filtering)

An optional `voice.fx` field runs an NPC's TTS through a Web Audio effects chain (band-limiting, saturation, ring modulation) for disguised, radio, or robotic voices. It applies everywhere that NPC speaks — person-chat, the video-call view, phone-chat, and barks — so a character sounds consistent across every contact. Narrator and player lines are never affected (they play under different speaker ids).

Set it to a **preset name** or a **custom object**:

```json
"voice": {
  "name": "Iapetus",
  "style": "Deliberately unplaceable, sanded-off accent. Unhurried and precise.",
  "language": "en-GB",
  "fx": "voice-distortion"
}
```

Presets (defined in `TTSManager.VOICE_FX_PRESETS`, `public/break_escape/js/systems/tts-manager.js`):

| Preset | Use for |
|--------|---------|
| `voice-distortion` | A disguised / obscured speaker — band-limited encrypted-comms voice with a light metallic edge, still intelligible. Used by Ghost in `m02_ransomed_trust`. |
| `radio` | Clean radio / handset band with light grit, no ring mod. |
| `robot` | Heavier robotic / vocoder-ish edge. |

Custom object (every field optional; the chain is `highpass → lowpass → drive → ringMod → makeup`):

```json
"fx": { "highpass": 220, "lowpass": 3400, "drive": 6, "ringMod": { "frequency": 75, "mix": 0.10 }, "makeup": 1.6 }
```

- `highpass` / `lowpass` — band-limit the voice in Hz (a tight band = telephone/radio feel).
- `drive` — waveshaper saturation (grit). ~0 clean, ~6 subtle, ~20 heavy.
- `ringMod` — `{ frequency, mix }`. Metallic/masked edge; `mix` is 0–1 and is the most aggressive knob (lower it, or drop `ringMod`, to soften).
- `makeup` — output gain to compensate for level lost to filtering/drive.

Keep FX restrained on speaking characters — heavy distortion fights the voice acting and hurts intelligibility. The validator checks that a preset name is known and that a custom object's fields are the right type and in range. FX is inert when server TTS is unavailable (there is no audio to process).

#### Knockout resilience — the mission must survive a KO of *any* NPC

The player can attack **any** person NPC at any time, and **KO is permanent** — there is no respawn. A well-built scenario stays both *completable* and *narratively coherent* no matter who the player knocks out. `m01_first_contact` is the reference: every conversation-gated task has a knockout fallback, and every plot-relevant NPC's KO feeds the debrief. Two fields carry this:

- **`taskOnKO`** — completes a task when the NPC is knocked out. The rule that actually matters: **a KO must never block mission completion.** If an NPC's conversation is the *only* way to complete a task on the **critical path** (required to finish the mission — the `missionConclusion` aim's `concludeRequires.tasksCompleted`, plus the non-optional tasks of every aim its `unlockCondition` chain depends on), it **must** have a `taskOnKO` (or `eventMapping`) fallback, or KO'ing it soft-locks the mission. It is **fine** for a KO to permanently close off a *side / lore* objective (a non-critical aim) — that can be an intended consequence of the player's choice; m01's `meet_kevin` is exactly this. **`taskOnKO` names only ONE task** — if an NPC's ink completes *two* critical tasks, wire the second one's completion through an `eventMapping` with `completeTask` on a phone/handler NPC keyed to the NPC's KO global (`global_variable_changed:<name>_ko`). See the `obtain_password_hints` wiring in `m02_ransomed_trust`. The validator reports a critical-path case as a **warning** and a side-objective case as a **suggestion**.
- **`globalVarOnKO`** — sets a global on KO so the closing debrief and end-credits can *acknowledge* the KO rather than contradicting it (e.g. "SARAH O'BRIEN: Removed — No ENTROPY connection"). A villain or secret NPC should have its KO drive the *same* resolution state a peaceful path would (e.g. an antagonist's `globalVarOnKO` reusing the `<villain>_confronted` global). For a hidden asset, add a debrief branch for the "neutralised without being identified" case.

The win condition itself (usually a `mission_complete` global set from a terminal/decision, not a conversation) should never route solely through an NPC that can be KO'd. The validator's objective-wiring check flags a KO-vulnerable **critical-path** task as a warning (a real soft-lock) and a KO-vulnerable **side-objective** task as a suggestion (acceptable if intended).

#### Patrol Behaviour

The `behavior.patrol` object controls how the NPC moves around its room:

```json
"behavior": {
  "patrol": {
    "enabled": true,
    "speed": 80,
    "waypoints": [
      { "x": 2, "y": 2, "dwellTime": 2000 },
      { "x": 6, "y": 4, "dwellTime": 1000 },
      { "x": 4, "y": 7 }
    ],
    "waypointMode": "sequential",
    "loop": true,
    "pauseForPlayer": false
  }
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `enabled` | `true` (auto) | Whether patrolling is active at spawn |
| `speed` | `80` | Movement speed in pixels/second |
| `waypoints` | — | Array of `{ x, y }` tile positions. Each may include `dwellTime` (ms) to pause at that point |
| `waypointMode` | `"sequential"` | `"sequential"` follows waypoints in order; `"random"` picks randomly |
| `loop` | `true` | `true` loops the route; `false` stops at the last waypoint |
| `pauseForPlayer` | `true` | Stop and face the player when they come close |
| `changeDirectionInterval` | `5000` | ms between random patrol target changes (random-patrol fallback only) |

For multi-room routes use `"multiRoom": true` with a `"route"` array instead of `"waypoints"`.

#### Bark Notifications

Any person NPC can display an in-world bark — a speech-bubble notification that appears briefly above the NPC and plays TTS audio if the NPC has a `voice` config.

Barks are triggered via event mappings (see below). Each NPC uses its own audio channel so multiple NPCs can bark simultaneously without cutting each other off.

```json
{
  "eventPattern": "global_variable_changed:alarm_triggered",
  "condition": "value === true",
  "onceOnly": true,
  "bark": "Intruder alert!",
  "barkDelay": 0
}
```

- **TTS**: automatically used when the NPC has a `voice` config. No extra field needed.
- **`barkDelay`**: milliseconds to wait after the event fires before showing the bark (default `0`). Use to stagger responses from multiple NPCs reacting to the same event so they don't all speak simultaneously.
- **Barks wait behind a minigame** (any except phone chat) and are released when it closes (`bark-release-policy.js`). They come out first in, first out, one every 2.5 s. Before each one shows, the mapping's `condition` is run again against the original event (so a `globalVars.x` term reads the current value), and a text with `skipIfGlobal` checks that global again; a bark that no longer passes is dropped, so write conditions that say when a line has stopped being true ("next is the restore" should require `!globalVars.restore_done`). A bark with no condition is never dropped for being stale. If more than 3 are waiting, the oldest ones beyond the newest 3 are dropped, but only if the same text is in the NPC's phone thread; barks from person NPCs have no such copy and are never dropped by the cap. Drops are logged with `console.debug` ("stale" or "capped").

#### NPC Timed Conversations (opening cutscenes)

Trigger a conversation automatically when the player loads the room:

```json
"timedConversation": {
  "delay": 0,
  "targetKnot": "start",
  "background": "assets/backgrounds/hq1.png",
  "waitForEvent": "game_loaded",
  "skipIfGlobal": "briefing_played",
  "setGlobalOnStart": "briefing_played"
}
```

| Field | Description |
|-------|-------------|
| `delay` | Milliseconds before triggering (use `0` for immediate) |
| `targetKnot` | Ink knot to jump to |
| `background` | Background image for person-chat overlay |
| `waitForEvent` | Wait for this game event before starting |
| `skipIfGlobal` | Skip if this global variable is truthy (prevents cutscene replaying on resume) |
| `setGlobalOnStart` | Set this global variable to `true` when conversation starts |
| `disableClose` | `true` prevents player closing the dialog |

#### NPC Event Mappings

React to game events on any NPC type:

```json
"eventMappings": [
  {
    "eventPattern": "global_variable_changed:derek_confronted",
    "condition": "value === true",
    "onceOnly": true,
    "conversationMode": "person-chat",
    "targetKnot": "aftermath",
    "background": "assets/backgrounds/hq1.png"
  }
]
```

Common event patterns:
- `"global_variable_changed:var_name"` — fires when a global variable changes (`condition: "value === true"`)
- `"room_entered:room_id"` — fires when player enters a room
- `"npc_ko:npc_id"` — fires when an NPC is knocked out
- `"npc_attacked:npc_id"` — fires when an NPC is attacked
- `"item_picked_up:item_type"` — fires when an item is picked up
- `"door_unlock_attempt"` — fires on any door unlock attempt (`condition: "data.connectedRoom === 'room_id'"`)
- `"object_interacted"` — fires when object interacted with (`condition: "data.objectType === 'vm-launcher'"`)
- `"conversation_closed:npc_id"` — fires when a conversation closes
- `"attack_aborted"` / `"attack_launched"` — fires from launch-device
- `"player_spotted:npc_id"` — fires when an NPC with `los.challengeOnSight` sees the player (see [Guards who challenge on sight](#guards-who-challenge-on-sight-loschallengeonsight))

Event mapping actions (can be combined):

| Action | Description |
|--------|-------------|
| `setGlobal: { "var": value }` | Set one or more global variables |
| `bark: "text"` | Show a bark bubble above the NPC and play TTS audio (if NPC has `voice`). Each NPC has its own audio channel so multiple NPCs can bark simultaneously. |
| `barkDelay: ms` | Milliseconds to wait before firing the bark (default `0`). Use to stagger responses from multiple NPCs reacting to the same event. |
| `targetKnot: "knot_name"` | Jump to this Ink knot (person NPCs only; updates `currentKnot` so next conversation starts there; does NOT work on phone NPCs after first open) |
| `conversationMode: "person-chat"` | Trigger a person-chat cutscene (person NPCs only). Requires `targetKnot`. |
| `background: "path"` | Background image for person-chat cutscene |
| `patrolOverride: { "targetTile": {"x": n, "y": n}, "speed": n, "stopOnArrival": true }` | Override current patrol — NPC walks directly to target tile. `stopOnArrival: true` halts patrol when destination is reached. |
| `setPatrolSpeed: number` | Change the NPC's patrol speed (pixels/second) from this point on |
| `setDwellMultiplier: number` | Multiply all patrol waypoint dwell times (e.g. `0.3` = 30% of normal pause time) |
| `setVisible: true/false` | Show or hide the NPC sprite in the world |
| `sendTimedMessage: { "delay": ms, "message": "..." }` | Send a timed message from this NPC (phone NPCs) |
| `completeTask: "task_id"` or `["id1","id2"]` | Mark a task complete |
| `unlockTask: "task_id"` | Unlock a locked task |
| `unlockAim: "aim_id"` | Unlock a locked objective aim |
| `onceOnly: true` | Ensure mapping only fires once |

#### Guards who challenge on sight (`los.challengeOnSight`)

A person NPC's `los` block sets his line of sight: `range` (pixels, default 200), `angle` (cone width in degrees, default 120, facing the way he walks or looks) and `visualize` (draw the cone). By default the cone is only used to decide whether he sees a lock being picked (`lockpick_used_in_view`). Add `challengeOnSight` and he also reacts when the player simply walks into his sight. It is off unless you add it, so no existing mission changes.

```json
"los": {
  "enabled": true, "range": 150, "angle": 120,
  "challengeOnSight": {
    "cooldown": 20000,
    "rooms": ["reception"],
    "skipIfGlobal": "visitor_badge_shown"
  }
},
"eventMappings": [
  {
    "eventPattern": "player_spotted:night_guard",
    "conversationMode": "person-chat",
    "targetKnot": "challenge_visitor",
    "cooldown": 0
  }
]
```

| Field | Default | Description |
|-------|---------|-------------|
| `enabled` | `true` | `false` turns a configured challenge off. `"challengeOnSight": true` is the same as `{}` (all defaults). |
| `cooldown` | `10000` | Milliseconds before he can challenge again. |
| `event` | `"player_spotted:<npcId>"` | Name of the event to emit. |
| `rooms` | any | Only while the player is in one of these rooms. He must be in the player's room in any case, because the cone ignores walls. |
| `requireGlobal` | none | Only while this global is truthy (`"alarm_raised"`), or while every global listed matches its value (`{ "alarm_level": 2 }`). |
| `skipIfGlobal` | none | Never while this global (or any in a list) is truthy, e.g. once the player has shown a badge. |

How it fires: while the player is in his room and inside his cone, and the conditions hold, the event is emitted once, with `{ npcId, roomId, playerPosition, timestamp }`. It doesn't fire again until the player has left his sight and come back, and the cooldown has passed. Nothing is checked while a conversation or minigame is open, so the challenge conversation itself doesn't retrigger it. KO'd and hidden NPCs see nothing. With `"enabled": false` on the `los` block itself he sees his whole room. The cooldown and sighting state are per session; a reload starts them fresh, so use `onceOnly` on the mapping (saved across reloads) for a challenge that must happen only once.

The event does nothing by itself: map it in `eventMappings`, on the guard (a `person-chat` knot, a `bark`) or on any other NPC (a handler text, `setGlobal`, `completeTask`). The mapping's own `cooldown`, `condition`, `onceOnly` and `maxTriggers` apply as usual; give a person-chat mapping `"cooldown": 0` so the guard's cooldown is the one that counts. The validator warns about unknown `los` and `challengeOnSight` fields, a challenge on a non-person NPC, and a challenge event that no mapping listens for.

### Phone NPCs (`npcType: "phone"`)

Contacts in the player's phone. Not rendered in the world — they exist only in the phone UI.

```json
{
  "id": "agent_0x99",
  "displayName": "Agent HaX",
  "npcType": "phone",
  "phoneId": "player_phone",
  "storyPath": "scenarios/my_scenario/ink/phone_handler.json",
  "currentKnot": "first_call",
  "avatar": "assets/characters/female_spy_headshot.png",
  "voice": { "name": "Aoede", "style": "Intelligence handler", "language": "en-GB" },
  "timedMessages": [
    {
      "delay": 3000,
      "message": "Agent, I'm your handler for this op.",
      "waitForEvent": "conversation_closed:briefing_cutscene"
    }
  ],
  "eventMappings": [
    {
      "eventPattern": "room_entered:server_room",
      "onceOnly": true,
      "setGlobal": { "server_room_entered": true },
      "sendTimedMessage": { "delay": 1000, "message": "You're in the server room." }
    }
  ]
}
```

**Important phone NPC rules:**
- Phone NPCs must **not** have `position` or `spriteSheet`
- Phone NPCs must have `phoneId` matching a phone in `startItemsInInventory`
- `targetKnot` in event mappings does **not** work after first conversation — use `setGlobal` + an Ink conditional hub choice instead
- `conversationMode` field is ignored on phone NPCs
- A phone NPC with no `timedMessages` still works as a contact the player can call manually

#### Field guides (exposure-gated handler lab sheets)

The handler (a phone NPC like Agent HaX) can hand the player optional **Field Guides** — in-universe lab sheets that teach the technique a challenge needs. The established pattern (see `m01_first_contact` and `m02_ransomed_trust`) gates each guide behind **exposure to the relevant challenge element**, then delivers it **on request** so the player is never spammed:

1. **Hold the guide.** Add a `lab-workstation` item to the handler's `itemsHeld`, with an `id`, a `name`, and a `labUrl` pointing at the published lab sheet (a markdown file in the `HacktivityLabSheets` repo with `game_fragment: true` and a matching `permalink`):
   ```json
   { "type": "lab-workstation", "id": "m02_scanning_exploitation_field_guide",
     "name": "SAFETYNET Field Guide: Scanning and Exploitation",
     "takeable": true,
     "labUrl": "https://cliffe.github.io/HacktivityLabSheets/labs/m02_ransomed_trust/safetynet-field-guide-scanning-and-exploitation/" }
   ```
2. **Offer on exposure.** An `eventMapping` fires when the player first reaches the challenge element (e.g. `object_interacted` with `data.objectType === 'vm-launcher'` — "do they have the Kali box yet?", or `item_picked_up:lockpick`, or `room_entered:server_room`). It sets a `<x>_guide_offered` global and sends a message offering the guide.
3. **Deliver on request.** In the handler's ink, a `support_hub` choice gated `{<x>_guide_offered and not <x>_guide_hint_given}` routes to a knot that fires `#give_item:lab-workstation:<id>` (the `id` must match an item in `itemsHeld`, or the give silently fails — the validator checks this).

Keep the offer/request globals in `globalVariables` (`<x>_guide_offered`, `<x>_guide_requested`). Gate on genuine exposure, not on time — a guide should appear because the player has walked into the thing it explains.

---

## Objectives System

Objectives structure the mission with `aims` (groups) containing `tasks` (individual goals):

```json
"objectives": [
  {
    "aimId": "establish_access",
    "title": "Establish Access",
    "description": "Get into the building",
    "status": "active",
    "order": 0,
    "unlockCondition": { "aimCompleted": "previous_aim" },
    "tasks": [
      {
        "taskId": "check_in",
        "title": "Check in at reception",
        "type": "npc_conversation",
        "targetNPC": "sarah_martinez",
        "status": "active",
        "optional": true,
        "showProgress": true,
        "onComplete": { "unlockAim": "next_aim", "unlockTask": "another_task", "setGlobal": { "var": true } }
      }
    ]
  }
]
```

### Task Types

| `type` | Required fields | Notes |
|--------|----------------|-------|
| `npc_conversation` | `targetNPC` | Complete by talking to the specified NPC ID |
| `enter_room` | `targetRoom` | Complete by entering the specified room ID |
| `unlock_object` | `targetObject` | Complete when an object with that ID is unlocked. Object must have an explicit `id` field. |
| `unlock_room` | `targetRoom` | Complete when the specified room is unlocked |
| `collect_items` | `targetItems` or `targetGroup` or `targetItemIds` + `targetCount` | Track item collection. `targetItems` matches by `type`; `targetGroup` matches `collection_group` on items; `targetItemIds` matches by `name` or `id`. Add `showProgress: true` for a progress counter. |
| `submit_flags` | `targetFlags`, `targetCount` | Track VM flag submissions. **Both are mandatory** — see below |
| `manual` | — | Completed only via `completeTask` in an event mapping |
| `custom` | — | Custom completion logic |

### How SecGen and Break Escape scenarios relate

A CTF mission is two coupled files: the **SecGen scenario** (`SecGen/scenarios/**/*.xml`) that builds the VMs, and the **Break Escape scenario** (`scenario.json.erb`) that wraps them in narrative. They are joined by **names** and by **order**, and both joins fail silently.

- The mission's `secgen_scenario` field points at the SecGen XML; Hacktivity builds it and matches it via `sec_gen_batches.scenario`.
- Each SecGen `<system>` has a **`system_name`**. On build, flags are extracted into `flags_by_vm = { system_name => [flag, …] }` (`mission.rb#parse_flag_hints_xml`).
- The ERB helpers look flags up **by `system_name`**: `vm_flags_json('<system_name>')`, `flags_for_vm('<system_name>')`, and every `"<system_name>:flag_N"` reference. **If the key isn't a real `system_name`, the live flags never resolve** — `flags_by_vm[key]` is `nil`, `vm_flags_json` returns `{}`, and it only breaks in Hacktivity mode. Mission 1 works because its key `shatter_server` *is* its target's `system_name`.
- The **console is a separate lookup**: `vm_object('<system_name>', {title:…})` attaches the player's terminal to a VM — normally the **attacker/Kali** box (where they work), *not* the flag-bearing target. Console key ≠ flag key.
- The second argument to each helper is the **standalone/dev fallback** only; live per-build flags replace it in Hacktivity mode.

**Flag ordering is deterministic.** `flag_1..flag_N` are 1-indexed by array position, and that order is the **document order of the `<generator type="flag_generator"/>` nodes in the SecGen XML** (established through `system_reader.rb` → `system.rb` → `xml_marker_generator.rb`; the only randomness picks the flag *format*, never position/count). So reordering the `flag_generator`s, or moving one between `strings_to_leak` and `strings_to_pre_leak`, renumbers the flags — re-derive the mapping and fix the `submit_flags` after any such edit. The ordering is correct but *implicit* (nothing pins a flag to a document by name); the durable fix would be explicit flag IDs keyed by name rather than position.

For a fully worked example — the four-flag mapping, the attacker-vs-target split, and the file:line anchors — see `scenarios/m02_ransomed_trust/VM_INTEGRATION.md`.

### Wiring VM flags — two failure modes that are silent

Both of these compile, validate against the schema, and look correct in the dungeon graph. Neither shows up until someone plays to the end and finds the mission unfinishable.

**1. `submit_flags` without `targetFlags` / `targetCount` can never complete.**

There is nothing for a submission to match against, so the task stays open forever, its aim never completes, and any aim gated behind it is stranded. Flag IDs are `<vm_name>:flag_N`, **1-indexed** in the order the flags appear in the top-level `flags` block:

```json
{
  "taskId": "submit_ssh_flag",
  "type": "submit_flags",
  "targetFlags": ["hospital_backup_server:flag_1"],
  "targetCount": 1,
  "currentCount": 0,
  "showProgress": true,
  "status": "active"
}
```

The validator now reports a missing `targetFlags` as ❌ INVALID.

**2. `flagRewards` using `emit_event` does not set a global.**

The flag-station fires the raw event, but only `sudo_flag_submitted` is hard-bridged to a global variable in `systems/interactions.js`. Any Ink gated on `flag_<x>_submitted` will therefore never open, so the handler's whole VM-phase hint tree can silently go dead.

Bridge it explicitly on the handler NPC, keyed off task completion:

```json
{
  "eventPattern": "objective_task_completed:submit_ssh_flag",
  "onceOnly": true,
  "setGlobal": { "flag_ssh_submitted": true }
}
```

Rule of thumb: **if an Ink `VAR` is meant to track VM progress, something must explicitly `setGlobal` it.** Declaring it in `globalVariables` is not enough.

### `unlockCondition`

Aims can be locked until prerequisites are met:

```json
"unlockCondition": { "aimCompleted": "survey_offices" }
"unlockCondition": { "aimsCompleted": ["return_intel", "deactivate_the_launch"] }
```

---

### Mission Conclusion

Mark exactly **one** aim as the mission-conclusion aim with `missionConclusion: true`. When that aim is completed the server writes `mission_concluded_at` (a one-time timestamp — idempotent on repeat calls) and returns `missionConcluded: true` in the API response. The client then triggers the configured `conclusionScreen`.

#### `missionConclusion`

```json
"missionConclusion": true
```

Set on the final aim. At most one aim per scenario may carry this flag. The validator errors if more than one aim has it.

#### `concludeRequires`

```json
"concludeRequires": {
  "tasksCompleted": ["submit_ssh_flag", "submit_linux_flag", "submit_sudo_flag"]
}
```

The ending gate. The **client** decides when the story is over — it owns the debrief and the credits — and calls `POST /games/:id/conclude`. This field declares the technical work the **server** will not let the story skip. The server refuses to write `mission_concluded_at` until every listed task is completed. Listed task IDs must exist (the validator errors if they do not).

**What belongs in it:** the large technical achievements only — the VM and CTF work the mission exists to teach. The reliable way to derive the list is the scenario's own dungeon graph: the flag nodes marked mandatory (`ruby scripts/generate_dungeon_graph.rb`, then the non-optional `kind: "flag"` nodes) are exactly the work no route can avoid.

**What must not:** story tasks. Story progress is *scored*, not gated — `calculate_task_score` is proportional, so unfinished work already costs marks. Gating on it withholds the ending for narrative bookkeeping, and a story task with a single completion route becomes an unannounced dead end. That is precisely how a finished m02 run once sat in `in_progress` forever, credits shown, with nothing to explain why.

Two supported keys:

| Key | Strength | Use for |
|---|---|---|
| `tasksCompleted` | Server-authoritative — those task records are written only after `validate_flag_submission` checks the flag | Technical work (flag submissions) |
| `globals` | Weaker, client-reported | Story state, never technical gating |

Omit the field entirely, or declare `"concludeRequires": {}`, to trust the client outright. That is the right answer for a scenario with no large technical work — declare the empty object to say so deliberately.

> **Note:** `requiresCompleted` was the previous form of this gate and is **no longer read by anything**. The validator errors if a scenario still declares it. Aim completion is unaffected: an aim still completes when its own non-optional tasks are done.

#### `conclusionScreen`

Defines which overlay the client shows when the conclusion is confirmed by the server, and which overlay to re-show if the player reloads the page after concluding.

| `type` | Behaviour |
|---|---|
| `end_screen` | Shows the standard mission-complete overlay (`window.showEndScreen`). |
| `bond_visualiser` | Opens the fullscreen SAFETYNET audio visualiser (`window.BondVisualiser.open()`). |

```json
"conclusionScreen": { "type": "end_screen" }
"conclusionScreen": { "type": "bond_visualiser" }
```

For `bond_visualiser` the credits sequence and victory music are normally wired through the music event system (e.g. a `conversation_closed:closing_debrief_person` trigger). `conclusionScreen` is only used on page reload to re-open the visualiser without replaying the conversation chain.

The validator warns if `missionConclusion: true` is present but `conclusionScreen` is absent.

#### Score and `missionConclusion`

Scores are computed as a raw formula: `(tasks_completed / total_tasks) × 70 + (aims_completed / total_aims) × 30`. The conclusion flag does **not** force the score to 100 %. A player who concludes the mission having skipped optional tasks will receive a proportional score.

---

## Global Variables

Declare all variables in `globalVariables` at the scenario root. Referenced in Ink stories, event conditions, and `onRead`/`onPickup`/`onInteract` handlers.

```json
"globalVariables": {
  "briefing_played": false,
  "derek_confronted": false,
  "start_debrief_cutscene": false,
  "ssh_flag_submitted": false,
  "audit_correct_answers": 0,
  "player_name": "Agent Zero"
}
```

Values can be `false`, `true`, `0`, or `""`. The validator will error if any `setVariable`, `globalVarOnKO`, or event mapping references a variable not defined here.

---

## Music System

Dynamic music based on in-game events:

```json
"music": {
  "events": [
    { "trigger": "game_loaded", "condition": "!globalVars.briefing_played", "playlist": "cutscene", "fade": false },
    { "trigger": "game_loaded", "condition": "globalVars.briefing_played === true", "playlist": "noir", "fade": false },
    { "trigger": "conversation_closed:briefing_cutscene", "playlist": "noir", "fade": true },
    { "trigger": "npc_hostile_state_changed", "condition": "isHostile === true", "playlist": "threat", "fade": true },
    { "trigger": "all_hostiles_ko", "playlist": "noir", "fade": true },
    { "trigger": "global_variable_changed:start_debrief_cutscene", "condition": "value === true",
      "playlist": "victory", "track": "Ghost in the Wire", "autoStop": true, "disableClose": true, "fade": true,
      "credits": [
        { "text": "MISSION COMPLETE", "style": "title", "condition": "!globalVars.player_launched_attack" }
      ]
    }
  ]
}
```

| Trigger | Description |
|---------|-------------|
| `game_loaded` | Fires on game start/resume |
| `conversation_closed:npc_id` | Fires when a conversation closes |
| `npc_hostile_state_changed` | Fires when any NPC becomes hostile |
| `all_hostiles_ko` | Fires when all hostile NPCs are knocked out |
| `global_variable_changed:var_name` | Fires when a global variable changes |

---

## ERB Template Helpers

Scenario files are `.json.erb` templates. Available helpers:

| Helper | Description |
|--------|-------------|
| `<%= @random_password %>` | Random 8-char alphanumeric password (changes per render) |
| `<%= @random_pin %>` | Random 4-digit PIN string |
| `<%= @random_code %>` | Random 8-char hex code |
| `<%= vm_object('system_name', fallback_hash) %>` | Returns VM console data as JSON for the named SecGen `system_name` (usually the attacker/Kali box); Hacktivity context or fallback |
| `<%= flags_for_vm('system_name', fallback_array) %>` | Returns the flag **array** as JSON for the named SecGen `system_name` (used in a flag-station's `flags:`) |
| `<%= vm_flags_json('system_name', fallback_array) %>` | Returns the flag **map** `{ "flag_1": value, … }` for the named `system_name` (used in the top-level `flags:` block). Same lookup as `flags_for_vm`, different shape. When no VM context is present, builds the map from `fallback_array`; when context is present but the name has no flags, returns `{}` (surfacing a wrong `system_name` rather than masking it) |
| `<%= base64_encode("text") %>` | Base64-encodes a string (for encoded notes puzzles) |
| `<%= rot13("text") %>` | ROT13-encodes a string (for cipher puzzles) |

Define custom helpers at the top of the `.erb` file inside `<% ... %>` blocks:

```erb
<%
def rot13(text)
  text.tr('A-Za-z', 'N-ZA-Mn-za-m')
end

def base64_encode(text)
  Base64.strict_encode64(text)
end

client_list_message = "The IT room PIN is: 2468"
%>
```

---

## Room Layout System (Grid-Based)

The game uses a **grid unit system** for room positioning that supports variable room sizes and four-direction connections.

### Grid Unit System

- **Base Grid Unit (GU)**: 5 tiles wide × 4 tiles tall (160px × 128px)
- **Tile Size**: 32px × 32px
- **Room Structure**:
  - Top 2 rows: Visual wall (overlaps room to north)
  - Middle rows: Stackable area (used for positioning calculations)
  - All rooms must be multiples of grid units

### Valid Room Sizes

**Width**: Must be multiple of 5 tiles (5, 10, 15, 20, 25...)

**Height**: Must follow formula `2 + (N × 4)` where N ≥ 1
- **Valid heights**: 6, 10, 14, 18, 22, 26... (increments of 4 after initial 2)
- **Invalid heights**: 7, 8, 9, 11, 12, 13...

**Examples**:
- **1×1 GU** (Closet): 5×6 tiles = 160×192px
- **2×2 GU** (Standard): 10×10 tiles = 320×320px
- **1×2 GU** (Hall): 5×10 tiles = 160×320px
- **4×1 GU** (Wide Hall): 20×6 tiles = 640×192px

### Room Positioning Algorithm

1. The `startRoom` is positioned at grid coordinates (0,0)
2. Rooms are positioned outward from the starting room using breadth-first traversal
3. Rooms align to grid boundaries using `Math.floor()` for consistent rounding
4. **North/South**: Rooms stack vertically, centered or side-by-side when multiple
5. **East/West**: Rooms align horizontally, stacked vertically when multiple
6. All positions are validated to detect overlaps

### Door Placement Rules

**North/South Doors**:
- **Size**: 1 tile wide × 2 tiles tall
- **Single door**: Placed in corner (NW or NE), determined by grid coordinates using `(gridX + gridY) % 2`
- **Multiple doors**: Evenly spaced across room width with 1.5 tile inset from edges

**East/West Doors**:
- **Size**: 1 tile wide × 1 tile tall
- **Single door**: North corner of edge, 2 tiles from top
- **Multiple doors**: First at north corner, last 3 tiles up from south, others evenly spaced

**Alignment**: Doors must align perfectly between connecting rooms. Special logic handles asymmetric connections (single door to multi-door room).

### Which corner a door lands on

The validator proves rooms do not overlap. It says nothing about *which side of a wall* each door ends up on — and that decides how the player enters a room, which matters when a room's art only reads well from one approach.

```bash
python3 scripts/predict_door_sides.py scenarios/my_scenario/scenario.json.erb
```

This mirrors the maths in `systems/doors.js` and prints the corner for every door, so you can check the layout before playtesting. The rules it encodes:

| Case | Corner |
|---|---|
| **N/S single door** | Parity of `(gridX + gridY)` — room origin for a north door, the *shared bottom wall* for a south door |
| **N/S single, neighbour has an array on the opposite side** | Parity ignored; aligns to this room's **index** in that array |
| **E/W single door** | **Always** 2.5 tiles down from the room top. No parity, no variation |
| **E/W multiple** | First at top, last at bottom, rest spread evenly |
| **N/S multiple** | First at left, last at right, rest spread evenly |

Two consequences worth designing around:

1. **A room an even number of GU tall gets its north and south doors on the same side.** The south parity is measured on the shared bottom wall, which is an even number of grid units below the origin, so the sum's parity is unchanged. You cannot get top-left *and* bottom-right on one room by parity alone. To force a side, give the **neighbour** an array on the facing side and rely on index alignment.
2. **To move a door to the other corner, move the room to an adjacent grid column.** Parity is positional, so inserting or resizing an upstream room by an odd number of grid units flips every door that depends on it.

#### Multi-room sides only position correctly for dead ends

`core/rooms.js` filters already-positioned rooms out of a connection array before placing the rest. So `"east": ["store", "corridor"]` only lays out as a vertical stack when **both** rooms are leaves reached solely through this room. If one of them is the route back to the rest of the map, it will already have been positioned by its other parent, the array collapses to a single placement, and the two rooms land on top of each other — which surfaces as a geometry overlap warning.

Design rule: **the way in can never be the second element of a multi-room side.**

#### Door art is generated, not authored

The `doors` tilelayer inside a room's `.tmj` is **ignored** — `core/rooms.js` skips it ("using sprite-based doors") and carves the wall tiles wherever it places a door sprite. You therefore do **not** need to edit a tilemap to add a door on a wall that has never had one. Connect the rooms and the engine handles it.

### Four-Direction Connections

Unlike the old system (north/south only), the new system supports:
- **North**: Connects to rooms above
- **South**: Connects to rooms below
- **East**: Connects to rooms on the right
- **West**: Connects to rooms on the left

Each direction supports multiple connections (arrays).

## Designing Solvable Scenarios

The canonical reference scenario is `scenarios/m01_first_contact/scenario.json.erb` — the most complete example, demonstrating every major system. Validate your scenario against it with the validator script.

1. **Clear Progression Path**: Design a logical sequence of rooms that can be unlocked in order
   - Ensure keys/codes for locked rooms are obtainable before they're needed
   - Use the four-direction connection system to create interesting navigation puzzles

2. **Tool Placement**: Place necessary tools early in the scenario
   - Critical tools like `lockpick`, `fingerprint_kit`, or `bluetooth_scanner` should be available before they're needed
   - Consider adding some tools to the initial inventory with `startItemsInInventory`

3. **Clue Distribution**: Spread clues logically throughout the scenario
   - Place hints for codes/passwords in accessible locations (bins, other NPCs)
   - Use readable objects (`notes`, `phone` voicemails, `pc` files) to provide guidance

4. **Lock Type Variety**: Use at least 3 different lock types to teach security concepts
   - `key` + lockpicking mini-game for physical security
   - `pin` for numeric codes found elsewhere in the scenario
   - `password` for computer access (with optional `postitNote` hint)
   - `rfid` for high-security doors (keycard required)
   - `flag` for VM-based hacking challenges

5. **Nested Containers**: Use containers within containers strategically
   - Avoid unsolvable dependency loops (key A inside box requiring key B, which requires key A)
   - Use `bin` containers with `locked: false` for discarded-clue items

6. **Objectives with Task Cross-References**: Verify all cross-references:
   - `targetNPC` IDs must exist in a room's `npcs` array
   - `targetRoom` must be a defined room ID
   - `targetObject` must match an object with an explicit `id` field
   - `targetGroup` must match `collection_group` on at least one item

7. **Global Variables for Ink State**: All variables referenced in Ink stories or event conditions must be declared in `globalVariables`. Use `false` as the default for boolean flags.

8. **Opening + Closing Cutscenes**: Canonical pattern from m01:
   - Opening: person NPC with `timedConversation` + `skipIfGlobal` + `setGlobalOnStart` in the start room
   - Closing: person NPC with `behavior.initiallyHidden: true` triggered by a phone NPC Ink story using `#set_global:start_debrief_cutscene:true` + `#exit_conversation`

9. **Fingerprint Mechanics**: When using biometric locks:
   - Ensure required fingerprints can be collected from objects with `hasFingerprint` in accessible rooms
   - Set appropriate `biometricMatchThreshold` (higher = more difficult)

10. **Dungeon Graph — Design as You Go**:
    - Add `puzzle_graph_*` metadata to objects and NPCs as you design each room, not as a retrofit at the end
    - Run `ruby scripts/generate_dungeon_graph.rb scenarios/my_scenario/scenario.json.erb` after each major structural change (new rooms, new locks, restructured objectives)
    - Review all three graph tabs before writing Ink dialogue or VM tasks — the graph reveals unsolvable lock chains and aims with no gameplay grounding far earlier than playtesting would
    - See §Dungeon Graph Metadata below for the full fields reference and design review checklist

11. **Testing and Validation**:
    - Run `ruby scripts/validate_scenario.rb scenarios/my_scenario/scenario.json.erb` before playtesting
    - Fix all `❌ INVALID` errors before testing; review `⚠ WARNING` items
    - Use `--output-json` to inspect ERB rendering if substitution looks wrong
    - Play through to verify the scenario is solvable from start to finish

---

## Authoring Rules

These are the mistakes that most often leave a mission unfinishable or silently broken. Each rule has one line of reason. The validator does not catch all of them yet.

### Positions, objects and items

- **NPC `position` is in tiles, relative to the room.** The engine does not clamp it, so `{x: 400, y: 300}` puts the NPC hundreds of tiles outside a 10x10 room and out of reach. Check every visible NPC and every patrol waypoint against the room template. Hidden cutscene and phone NPCs conventionally use 500,500.
- **Objects hold items in `contents`, never `itemsHeld`.** `itemsHeld` is the NPC inventory field. An object that uses it opens empty and its unlock task never completes.
- **Patrols use `patrol.waypoints`.** `patrol.route` is only for multi-room `{room, waypoints}` segments.
- **Pin objects that have no template slot.** Without a position they land on a random spot, sometimes in a doorway.
- **Give required items a fallback if an NPC carries them.** An NPC in a room loaded after the start has no sprite at KO time, so its `itemsHeld` never drops. Hand the item from a HaX `#give_item` on `npc_ko:<id>`, and make that handler hand the item itself, not just complete the task.
- **Notes cannot be flag rewards.** A note given by a flag reward never reaches the inventory or the notepad. Give the note from an NPC `#give_item` or place it in a container.

### Flags and tasks

- **`submit_flags` targets are station-qualified.** Use `<station>:<vmid>-flagN` (for example `flag_station_dropsite:bms_jump_server-flag1`). The `vm:flag_1` reference form never matches, so the task never completes.
- **Every `collect_items` task needs `targetCount`.** Without it the count check compares against `undefined` and never passes.
- **Let collect tasks complete themselves.** Do not call `completeTask` on one from a mapping. The server rejects it if the pickup has not landed yet, and the real pickup is then ignored.
- **Tasks in later aims ship `status: "active"`.** `unlockAim` only activates the first task of an aim.
- **Do not put a task that can finish early into a late aim.** A locked aim reveals itself when any of its tasks completes.
- **One submission point per flag.** An object with `lockType: flag` and its own `requires` opens a second submission UI and strands the drop-site task. Use a flag reward `unlock_object` instead.
- **The `missionConclusion` aim's last task completes at the end of the debrief.** The conclusion screen opens the moment that task completes, so a task finished on a story decision puts the credits over the debrief. End the aim with a debrief task, completed on the debrief's last line.
- **Put `#complete_task` near the top of a first-meeting knot.** A player who closes the conversation early would otherwise strand the task. The same goes for conclusion tasks.

### Event mappings

- **`&&` is the only operator in an eventMapping `condition`.** `||` and parentheses always evaluate false, so the handler is silently dead. Write one mapping per alternative and guard duplicates with a global.
- **Use `npc_ko:<id>` to react to a KO.** `globalVarOnKO` sets its global without emitting `global_variable_changed`, so a mapping on that global never fires. Use a dedicated `<npc>_ko` global, not a story global another outcome must exclude.
- **Scenes opened by `npc_ko:<id>` need `disableClose: true`.** A KO'd NPC cannot be talked to again and the event does not re-fire.
- **An NPC's mappings register only after its room loads.** A `setVisible` on an event that fires earlier is lost. Reveal on `room_entered:<the NPC's own room>`, or put the mapping on an always-loaded NPC such as HaX.
- **Hide an NPC with a `setVisible: false` mapping, not `#remove_npc`.** `#remove_npc` fails for NPCs in rooms loaded after the start.
- **`conversation_closed:<npc>` can fire twice, and phone chats never emit it.** Make handlers idempotent by routing on a global, and open debriefs from a person-chat or a global, not a phone close.
- **`item_picked_up:` carries the item type, not its id.** Match on the type and add a `data.itemId` condition.

### Timers

- **Timers need conditions.** The HUD clock ignores `cancelOnGlobal`, and a reload restarts any timer whose start global is true. Put `!globalVars.done && ...` as a `condition` on every timer and on its expiry action, and guard the arming mapping so it cannot re-arm after the win.
- **Start finale clocks once the VM work is done.** Timers run on wall-clock time, VM time included.
- **Gate HaX timed messages near scripted conversations.** A timed message can open a phone chat over a conversation in progress.

### Ink

- **Never end an NPC conversation in `DONE` or `END`.** Re-talking an ended story shows "(End of conversation)". Every exit is `#exit_conversation` on its own line, then `-> hub` (or `-> after_choice`).
- **Guard once-only decision scenes.** Use `{fate != "": -> after_choice}`, or talking again replays the scene and overwrites the outcome.
- **Put action tags above the line they belong to.** Use `#give_item:<type>:<itemId>`, with the id on the NPC's `itemsHeld` entry, and set "given" globals from an `item_picked_up:<type>` mapping, not in ink.
- **Use synced-global `VAR`s, not `EXTERNAL` functions.** The engine binds only six externals; an unbound one throws.
- **`setVariable` does no arithmetic.** `"x + 1"` assigns the string. Use one boolean per item instead of a counter.
- **First-meeting openers need their own knot that diverts.** Choices in a `{cond: ...}` block without a divert merge into the next hub and are lost after one pick.
- **Do not preload a contact whose `start` reveals plot.** The phone runs every preloaded contact's `start` knot on first open, and `~` assignments there write real globals.
- **Run `inkcheck.js` with an explicit knot** (`start`). The root container alone proves little.

### Layout and canon

- **Check door alignment.** A north/south connection between rooms of different widths can leave the doors about 320px apart. Use `tools/pass2/render.rb` and `tools/pass2/door_align.py`, and prefer single east/west connections and equal-width north/south pairs. `multi` connections cannot align middle or overflow doors.
- **Do not park a hidden or KO'd guard in a room with a pickable lock.** Their line-of-sight cone still interrupts lockpicking.
- **SAFETYNET has no arrest powers.** Agents detain and hand suspects to the police. The handler is displayed as "Agent HaX". Her NPC id stays `agent_0x99` in every mission (m05 uses `agent_0x99_handler`): it is the shared handler id, so don't rename it to match the display name. Other renamed NPCs do get matching ids.
- **Use UK English** in player-facing text, including "Cyber Security" with a space.

### Common bugs and how to avoid them

These turned up in more than one mission during the pass-4 reviews and playtests (October 2026). Each has a rule, an example, and where it is caught: **validator** (`ruby scripts/validate_scenario.rb`), **lint** (`node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<m>/`) or **review** (the `scenario-design-review` and `npc-dialog-review` checklists, and playtests). The ink-side classes are written up in more detail in `README_ink_best_practices.md` ("Common ink bugs").

Scenario file:

- **A lockpick catch needs a lock to catch.** A `lockpick_used_in_view` mapping fires only for a person NPC with `conversationMode: "person-chat"`, when the player picks a key lock in that NPC's room or a door into it. *m02: Val's catch sat in a room with no pickable lock, and Bernie's had no person-chat, so neither ever fired.* (validator)
- **An NPC outside the start room only hears events once its room has loaded.** NPCs register room by room as the player arrives (`npc-lazy-loader.js`, then `registerNPC` and `_setupEventMappings` in `npc-manager.js`), and the start room loads first. A mapping on a `global_variable_changed:*`, `item_picked_up:*`, `npc_ko:*` or `objective_*` event for an NPC in any other room never runs if the event fires before the player has been there. A missed bark harms nobody, so the validator only warns when the mapping has a lasting effect (`setGlobal`, `completeTask`, `unlockTask`/`unlockAim`, `setVisible`, `targetKnot` or a `conversationMode`, `patrolOverride`, `setPatrolSpeed`, `setDwellMultiplier`, `sendTimedMessage`); bark-only mappings pass (phone NPCs register with the room that lists them, so a phone NPC outside the start room has the same gap). Relay it: put a mapping for the same event on a start-room NPC that sets a global, and have the late NPC's `room_entered:<own room>` mapping read that global. The validator also accepts a `room_entered:<own room>` mapping whose condition reads the same global (a catch-up), a global only ever set inside that room (including by a backup-recovery console), an objective that can only be completed there, and a `room_entered` for a room only reachable through the NPC's room. If missing the effect is fine, add `"fireOnlyWhenLoaded": true` to the mapping (validator opt-out, no effect in the game). *sis01: Priya S. in the incident room had a mapping on `ico_deadline_missed`; if the player never visited, the debrief never opened. Sarah, in the start room, now relays it.* (validator)
- **The opening cutscene waits for the game.** Give the start-room `timedConversation` `"waitForEvent": "game_loaded"`. *m04 and m05 fired theirs on the first tick, under the title screen.* (validator)
- **A note an NPC hands over counts as read on hand-over.** Its `onRead` fires the moment it is given, or picked up after a KO. Don't let that global open an aim or decide a case the player is meant to reach by reading. *m05: Patricia's vetting file named Torres the instant she passed it across.* (validator, suggestion)
- **Every speaking character has their own art.** Give each one a v2 sheet with `spriteTalk`, `spriteVisemes` and a headshot `avatar`, and don't give two different characters the same sheet. *m04: Vance was on the generic `hacker` sheet and the gate guard looked like the operatives; m08: Phantom and Netherton were twins.* (validator)
- **Keep interactable things a tile apart, and NPCs out of the furniture.** The interaction range is 32 px. *m06: the rack sheet 23 px from the flag station opened the station; Satoshi against his desk could only be reached from one side; m02: Bed 4's bedhead unit kept the player 36 px from the bed.* Pinned objects are checked (validator); Tiled-slot objects and furniture aren't, so walk up to each one in a playtest (review).
- **A bark doesn't repeat the line it opens.** A `sendTimedMessage` or `timedMessages` text shows first; if the chat then opens on the same words, the player reads them twice. *m07: "Agent 0x00. Don't look for the trace." then the same line again.* (validator)
- **Every ink `VAR` that's read is set somewhere, and every `#set_global` is declared.** A read-only `VAR` with no same-named global is a dead condition; an undeclared `#set_global` is usually a typo. *m06: `recruitment_accepted` was read and never set; m08: `witness_heard` was set and never read (harmless, but say so).* (validator)
- **Task, aim and item names don't give the answer away.** *m05: an item called "Torres Office Keycard" and the to-do list "Get a keycard for Torres' office" solved the whodunnit before it began; m04: the aim describing the plant-room fingerprint reader appeared in Hall 1, before the player had seen the reader.* (review)
- **Status answers follow progress.** A sticky "Where do I stand?", "Remind me where we are" or "What's the clock?" answer must branch on the globals that change, down to the step the player is on. *m03, m04, m06 and m07 all had a recap that was right for the first half and wrong for the second.* (review, playtest)
- **The first phone contact checks progress.** A contact first opened late in the mission must not offer its opening check-in. *m06: opened at the data centre, HaX asked how the FCA cover was holding.* (review, playtest)
- **Credits and debrief lines match what the player did.** Check each conditional line against every route that can reach it. *m03: "the guard never logged you" and PERFECT STEALTH after the guard had challenged the player; m06: Priya's "Drew the graph" credit after one question.* (review)
- **Space timed texts 4-6 s apart.** Two `sendTimedMessage` or `timedMessages` texts triggered by the same event, with delays under 4 s apart and conditions that can both hold, stack as toasts and the first is gone before it can be read. Space them or fold them into one message. *m04 (Vance's card and the RFID guide), m05 (two barks off one object click).* (validator warning; pairs whose conditions can't both be true, such as `x` against `!x`, or where one mapping's `setGlobal` blocks the other, aren't reported)
- **A global that is set should be read.** A global set by `setGlobal`, `setGlobalOnStart`, `globalVarOnKO`, an `onRead`/`onPickup` `setVariable`, an ink `#set_global` or `~` assignment, that no condition, `skipIfGlobal`-style field, `global_variable_changed` mapping, credit or music condition, ink read or engine code ever mentions, is dead weight and reads as if it mattered. Use it or drop it. The mirror of "every ink `VAR` that's read is set somewhere". *m05: `mission_priority` (the opening's choice changed nothing); m08: `witness_heard`.* (validator suggestion)
- **A credits section needs a line that always prints.** A `section-header` whose entries all carry a `condition` can come out as a bare heading if no condition holds. Add an unconditional line, or check that the conditions cover every route. *m05: the Recruiter section.* (validator suggestion; it can't prove exhaustive conditions, so a section that does cover every route is a deliberate pass)

Ink (details and examples in `README_ink_best_practices.md`):

- **Choices in a `{cond: ...}` block don't stop the flow.** Use `- else:` inside the block, never a second `{not cond: ...}` block after it. *m06: Dani, Priya and Satoshi greeted a first-time visitor with "Hi again".* (lint: `choice-fallthrough`)
- **A knot a conversation parks on prints a line.** A re-talk re-enters the knot that owns the saved choices; if it prints nothing, the player gets the buttons with no fresh line, which playtesters read as a blank screen. Add a re-entry line. *m03 receptionist and Victoria, m04 Vance, m08 Netherton.* (lint: `blank-reentry`)
- **Influence tags sit above a spoken line.** Before a divert, the tag attaches to the next knot's first line. *m06: Irina's "+ Influence" popped up on a Narrator line.* (lint: `tag-on-narrator`)
- **Phone contacts' lines take no `Name:` prefix.** *m03, m04, m08 phone inks.* (lint: `phone-self-prefix`)
- **A spoken goodbye gets a reply.** *m08: "[I'll leave you to it.]" closed the chat on the player's own bubble.* (lint: `exit-no-reply`)
- **Asterisk cues stay rare and off key information.** *m07: "\*reading\* Two hundred and forty."* (lint: `stage-cue-in-info`, `stage-cue-density`)
- **No "Not X. Y." or "She is not X. She Y." in dialogue or narration.** (lint: `not-x-but-y`)
- **`#speaker:` tags don't pick the speaker.** Only `#speaker:player` and `#speaker:npc[:id]` do anything in person-chat; a two-part tag such as `#speaker:analyst` is ignored and the `Name:` prefix decides. Write the prefix. *m06 `#speaker:analyst`, `#speaker:trader`.* (review)
- **Choices only quote what the player has heard.** A choice that answers or quotes a line the NPC hasn't said, or states something that didn't happen on this route, reads as a bug. *m03: "[The desk was empty when I came in. I signed myself in.]" on a route where the player never signed in; m04: Relay answered a reply nobody gave.* (review)
- **A hub offers ten choices or fewer at once.** A knot's choice block (sticky, once-only and conditional choices all count) with more than ten crowds the screen and buries the topic that matters now. Order by relevance: topics that arrive later in the mission go first in the ink, so the newest, most relevant choices sit at the top (see m01's handler hub, `m01_phone_agent0x99.ink`, knot `support_hub`), and retire spent topics with a `not … _given` guard. *m02, m05 and m06 phone hubs reached 19-20 declared choices.* (lint: `crowded-hub`; a hub where almost every conditional choice is retired and the unconditional ones sit last, as in m01, passes)

## Dungeon Graph Metadata

Break Escape uses a metadata layer on scenario objects to let the dungeon graph generator (`scripts/generate_dungeon_graph.rb`) produce an interactive HTML visualisation of the puzzle dependency graph — showing which items, clues, and tasks unlock which locks, rooms, and objectives.

**Adding this metadata and reviewing the generated graph is a required part of the scenario design process, not an optional finishing step.** The graph exposes dependency loops, soft-locked progression, and aims that aren't grounded in player actions before you invest time playtesting. Design the metadata alongside your room and lock layout, then regenerate and review the graph whenever you add or restructure puzzles.

These fields have **no effect on gameplay** but are read by the graph generator.

### Fields Reference

| Field | Applies to | Type | Description |
|-------|-----------|------|-------------|
| `puzzle_graph_unlocks` | any object, NPC item, task | `string` or `[string]` | The lock ID or room ID this item/task unlocks in the graph. May name `lock_<object_name>` synthetic nodes or real room IDs. |
| `puzzle_graph_role` | any object, NPC item | `string` | Node type override. Valid values: `"key"` (key/item node), `"clue"` (clue note), `"tool"` (security tool), `"lock"` (treat a non-`locked` object as a lock barrier — gets `lock_` prefix), `"vm"` (VM challenge node), `"item"` (generic item). |
| `puzzle_graph_optional` | any object, NPC item | `boolean` | `true` renders the dependency edge as dashed (optional path, not required for completion). |
| `puzzle_graph_and_with` | any object, NPC item | `string` | AND-gate: this item must be combined with the named item to unlock the target (rendered as a combined edge with a `+` gate node). |
| `puzzle_graph_reveals` | notes, text_file | `string` | Designer annotation describing what this clue reveals. Not used in graph rendering but useful as inline documentation. |
| `puzzle_graph_note` | any object | `string` | Free-form designer annotation (e.g. multi-step decode logic). No effect on graph output. |
| `puzzle_graph_aim` | any object | `string` | Aim ID (`aimId` from `objectives`) that this object is a barrier or milestone for. Draws a bridge edge in the **Integrated Graph** tab only, connecting the puzzle node to the story aim. Use `puzzle_graph_role: "lock"` together with this field to represent non-`locked` barriers. |
| `puzzle_graph_links` | any object | `[{from, to, dashed?}]` | Explicit cross-object edges added after all nodes are built. Use when referencing nodes that don't yet exist at walk time (e.g. NPC action nodes or aim nodes in later rooms). `from`/`to` are node IDs or display names. |
| `puzzle_graph_actions` | NPC (`npcs[]`) | `[{id, label, unlocks_aim?}]` | NPC conversation/interaction milestones. Each entry creates an **action node** in the graph connected to the NPC. `unlocks_aim` draws a bridge edge to a story aim in the **Integrated Graph**. Use to represent "talk to NPC" as a first-class puzzle step. |

### When to Add `puzzle_graph_unlocks`

Add `puzzle_graph_unlocks` anywhere a player must find/use an item to unlock something:

- **Clue notes inside locked containers** — the note that reveals a PIN or password
- **Keys held by NPCs** — items in `itemsHeld` that are needed to open a lock
- **Readable text files on PCs** — files whose content provides an access code
- **`submit_flags` tasks** — connect flag submission to its narrative consequence
- **Items in `startItemsInInventory`** — if a starting item is the key to the first lock

### Lock ID Convention

Lock IDs follow the pattern `lock_<object_name>` (e.g., `lock_derek_personal_safe`, `lock_server_room`). These match the synthetic nodes generated by the dungeon graph script. Room IDs (e.g., `server_room`) are used directly as targets when an item unlocks room access rather than a specific object.

### Examples

#### Clue note inside a locked safe

```json
{
  "type": "notes",
  "name": "IT Room Access Code",
  "takeable": true,
  "readable": true,
  "text": "IT room code: 1234",
  "puzzle_graph_unlocks": "lock_it_room_door",
  "puzzle_graph_role": "clue"
}
```

#### NPC-held key with AND-gate

```json
{
  "type": "key",
  "name": "Server Room Keycard",
  "takeable": true,
  "puzzle_graph_unlocks": "lock_server_room_door",
  "puzzle_graph_role": "key",
  "puzzle_graph_and_with": "server_room_pin_code"
}
```

#### Optional path (dashed edge in graph)

```json
{
  "type": "notes",
  "name": "Backup Access Instructions",
  "takeable": true,
  "readable": true,
  "puzzle_graph_unlocks": "lock_archive_terminal",
  "puzzle_graph_optional": true
}
```

#### `submit_flags` task linking to narrative consequence

```json
{
  "taskId": "submit_ssh_flag",
  "type": "submit_flags",
  "title": "Submit SSH flag",
  "puzzle_graph_unlocks": "entropy_archive_unlocked"
}
```

#### NPC conversation as a puzzle step (`puzzle_graph_actions`)

Use `puzzle_graph_actions` on a person NPC to represent talking to them as a required step that gates a story aim:

```json
{
  "id": "ravi_anand",
  "displayName": "Ravi Anand",
  "npcType": "person",
  "taskOnKO": "brief_ravi",
  "puzzle_graph_actions": [
    { "id": "brief_ravi", "label": "Brief Ravi on findings", "unlocks_aim": "investigate_attack" }
  ],
  "itemsHeld": [
    {
      "type": "keycard",
      "name": "Ravi's RFID Access Card",
      "takeable": true,
      "puzzle_graph_unlocks": "ward_7"
    },
    {
      "type": "notes",
      "name": "IT Security Authorisation Code",
      "takeable": false,
      "puzzle_graph_unlocks": "dual_auth_panel",
      "puzzle_graph_and_with": "Clinical Engineering Authorisation Code"
    }
  ]
}
```

#### Non-locked barrier mapped to a story aim (`puzzle_graph_role: "lock"` + `puzzle_graph_aim`)

When a device or terminal is a narrative barrier (not a JSON `locked` object) and you want it to appear as a lock gate tied to an aim:

```json
{
  "type": "vm-launcher-desktop",
  "name": "Network Isolation Panel",
  "puzzle_graph_role": "lock",
  "puzzle_graph_aim": "restore_operations"
}
```

#### Explicit cross-object edges (`puzzle_graph_links`)

Use when two nodes need an edge but the target node doesn't exist at the time the object is processed (e.g. linking a VM dashboard to a later NPC action node):

```json
{
  "type": "siem_dashboard",
  "name": "SIEM Console",
  "puzzle_graph_role": "vm",
  "puzzle_graph_links": [
    { "from": "siem_console", "to": "action_brief_ravi" },
    { "from": "siem_console", "to": "it_security_authorisation_code", "dashed": true }
  ]
}
```

### Generating the Graph

```bash
ruby scripts/generate_dungeon_graph.rb scenarios/my_scenario/scenario.json.erb
# Output: scenarios/my_scenario/dungeon_graph.html (open in browser)
```

Related tooling:

```bash
python3 scripts/predict_door_sides.py scenarios/my_scenario/scenario.json.erb
# Prints the corner each door lands on -- see Which corner a door lands on
```

The output is a three-tab HTML page:
- **Puzzle Graph** — objects, locks, rooms, and their dependencies
- **Story Graph** — objectives, aims, and task completion edges  
- **Integrated Graph** — both layers combined with a highlighted critical path

### Graph Design Review

Generate and review the graph at each major design stage — before writing Ink dialogue, before creating VM tasks, and after any structural change to rooms or lock chains.

**Completability checks (Puzzle Graph tab)**

- Every room that is locked has an incoming edge from a reachable key or clue. If a lock node has no incoming edges, the player has no way to open it.
- There are no circular dependencies — a key is not inside a locked container that requires the same key to open.
- Every clue note or text file that reveals a code has an outgoing `puzzle_graph_unlocks` edge. Orphaned clue nodes that don't point anywhere indicate the item serves no puzzle purpose.
- Optional paths (dashed edges) do not carry any required lock. If removing an optional path would make a lock unreachable, it should be a required edge instead.

**Aim/narrative alignment checks (Story Graph and Integrated Graph tabs)**

- Every objective aim has at least one incoming bridge edge from a puzzle action or puzzle item. An aim with no connections is not grounded in gameplay — the player has no in-world activity that maps to it.
- The critical path (highlighted in the Integrated Graph) reflects the intended experience arc. If a late-game aim appears early in the critical path, the narrative sequence is out of order.
- Aims marked as `status: "locked"` have their unlock condition represented as a dependency in the graph. If an aim unlocks automatically with no in-world trigger, consider whether a `puzzle_graph_actions` node or event mapping is missing.
- Conversation milestones (NPCs the player must talk to) are represented as `puzzle_graph_actions` nodes. If a key NPC briefing is not visible in the graph, add the action node so the dependency is explicit.

**Lock type variety check**

- Scan the Puzzle Graph for lock node labels (`Password Lock`, `PIN Lock`, `Key Lock`, `RFID Lock`, etc.). A scenario where every lock is the same type offers limited educational coverage of access-control concepts. Aim for at least three distinct lock types per scenario.

**Signs the metadata needs more work**

- The Puzzle Graph is mostly empty while the scenario has many locks — most clues and keys are missing `puzzle_graph_unlocks` annotations.
- The Story Graph shows aims but the Integrated Graph has no bridge edges between the two layers — `puzzle_graph_aim` and `puzzle_graph_actions` fields are absent.
- Room nodes appear in isolation with no edges — they are disconnected areas not reachable from the critical path.

### Validator Behaviour

The scenario validator (`scripts/validate_scenario.rb`) will:
- Emit a `💡 SUGGESTION` for each clue item inside a locked container that is missing `puzzle_graph_unlocks`
- Emit a `💡 SUGGESTION` for each `submit_flags` task without `puzzle_graph_unlocks`
- Emit a `⚠ WARNING` if a `puzzle_graph_unlocks` target is not a recognised room ID, object ID, or `lock_*` ID
- Emit a `✅ GOOD PRACTICE` confirmation when the scenario has any `puzzle_graph_*` metadata
- Emit a `💡 SUGGESTION` to add metadata when none is found at all
