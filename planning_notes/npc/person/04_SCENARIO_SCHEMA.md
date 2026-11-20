# Scenario JSON Schema Extensions for Person NPCs

## Overview
This document defines the JSON schema extensions needed to configure in-person NPCs in scenario files.

## NPC Configuration Schema

### Base NPC Properties (Existing)
These properties already exist for phone NPCs:

```typescript
interface NPCBase {
  id: string;                    // Unique identifier
  displayName: string;           // Display name in UI
  storyPath: string;             // Path to compiled Ink JSON
  avatar?: string;               // Avatar image path (for phone)
  currentKnot?: string;          // Starting knot (default: "start")
  eventMappings?: EventMapping[]; // Event → bark mappings
  timedMessages?: TimedMessage[]; // Scheduled messages
}
```

### New Properties for Person NPCs

```typescript
interface NPCPerson extends NPCBase {
  // NPC Type (determines interaction modes)
  npcType: "phone" | "person" | "both";
  
  // Phone Configuration (required for "phone" and "both")
  phoneId?: string;              // Which phone this NPC appears in
  
  // Person Configuration (required for "person" and "both")
  roomId?: string;               // Room where NPC sprite appears
  position?: NPCPosition;        // Position within room
  spriteSheet?: string;          // Texture key (default: "hacker")
  spriteConfig?: SpriteConfig;   // Animation configuration
  interactionDistance?: number;  // Interaction range in pixels (default: 80)
  
  // Appearance
  direction?: "up" | "down" | "left" | "right"; // Initial facing direction
  scale?: number;                // Sprite scale (default: 1)
  
  // Behavior
  canMove?: boolean;             // Can NPC move? (default: false, future feature)
  patrolRoute?: PatrolPoint[];   // Movement waypoints (future feature)
}
```

### Position Configuration

```typescript
interface NPCPosition {
  // Option 1: Grid coordinates (tiles from room origin)
  x?: number;                    // Tile X coordinate
  y?: number;                    // Tile Y coordinate
  
  // Option 2: Absolute pixel coordinates
  px?: number;                   // Pixel X coordinate (world space)
  py?: number;                   // Pixel Y coordinate (world space)
}
```

**Usage:**
- Use `{ x, y }` for tile-based positioning (easier for scenario design)
- Use `{ px, py }` for precise pixel positioning
- If both are provided, pixel coordinates take precedence

### Sprite Configuration

```typescript
interface SpriteConfig {
  // Idle animation
  idleFrame?: number;            // Single frame for static idle (default: 20)
  idleFrameStart?: number;       // First frame of idle animation (default: 20)
  idleFrameEnd?: number;         // Last frame of idle animation (default: 23)
  
  // Greeting animation (optional)
  greetFrameStart?: number;      // First frame of greeting
  greetFrameEnd?: number;        // Last frame of greeting
  
  // Talking animation (optional)
  talkFrameStart?: number;       // First frame of talking
  talkFrameEnd?: number;         // Last frame of talking
  
  // Animation settings
  animPrefix?: string;           // Animation name prefix (default: "idle")
  frameRate?: number;            // Animation frame rate (default: 4 for idle)
}
```

## Complete Examples

### Example 1: Phone-Only NPC (Existing)
```json
{
  "id": "anonymous_tipster",
  "displayName": "Anonymous",
  "npcType": "phone",
  "phoneId": "player_phone",
  "avatar": "assets/npc/avatars/npc_neutral.png",
  "storyPath": "scenarios/ink/tipster.json"
}
```

### Example 2: Person-Only NPC (New)
```json
{
  "id": "security_guard",
  "displayName": "Security Guard Mike",
  "npcType": "person",
  "roomId": "lobby",
  "position": { "x": 8, "y": 5 },
  "spriteSheet": "hacker",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  },
  "storyPath": "scenarios/ink/guard.json",
  "direction": "down",
  "interactionDistance": 80
}
```

### Example 3: Dual-Identity NPC (New)
```json
{
  "id": "alex_sysadmin",
  "displayName": "Alex the Sysadmin",
  "npcType": "both",
  
  "phoneId": "player_phone",
  "avatar": "assets/npc/avatars/npc_helper.png",
  
  "roomId": "server1",
  "position": { "x": 12, "y": 8 },
  "spriteSheet": "hacker",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23,
    "greetFrameStart": 24,
    "greetFrameEnd": 27,
    "talkFrameStart": 28,
    "talkFrameEnd": 31
  },
  "direction": "down",
  "interactionDistance": 80,
  
  "storyPath": "scenarios/ink/alex.json",
  
  "eventMappings": [
    {
      "eventPattern": "room_entered:ceo",
      "targetKnot": "on_ceo_office_entered",
      "cooldown": 0,
      "onceOnly": true
    }
  ],
  
  "timedMessages": [
    {
      "delay": 30000,
      "message": "Hey, just checking in. Find anything interesting?",
      "type": "text"
    }
  ]
}
```

### Example 4: Multiple NPCs in Same Room
```json
{
  "npcs": [
    {
      "id": "receptionist",
      "displayName": "Sarah the Receptionist",
      "npcType": "person",
      "roomId": "reception",
      "position": { "x": 5, "y": 3 },
      "spriteSheet": "hacker",
      "storyPath": "scenarios/ink/receptionist.json"
    },
    {
      "id": "visitor",
      "displayName": "Suspicious Visitor",
      "npcType": "person",
      "roomId": "reception",
      "position": { "x": 8, "y": 6 },
      "spriteSheet": "hacker",
      "storyPath": "scenarios/ink/visitor.json",
      "direction": "left"
    }
  ]
}
```

### Example 5: Pixel-Positioned NPC
```json
{
  "id": "ceo",
  "displayName": "The CEO",
  "npcType": "person",
  "roomId": "ceo_office",
  "position": { "px": 640, "py": 480 },
  "spriteSheet": "hacker",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  },
  "storyPath": "scenarios/ink/ceo.json",
  "interactionDistance": 100
}
```

## Scenario Root Level Configuration

### Phone Items (Existing, Updated)
```json
{
  "startItemsInInventory": [
    {
      "type": "phone",
      "name": "Your Phone",
      "takeable": true,
      "phoneId": "player_phone",
      "npcIds": ["anonymous_tipster", "alex_sysadmin"],
      "observations": "Your personal phone with contacts"
    }
  ]
}
```

**Key Changes:**
- `npcIds` array should include IDs of NPCs with `npcType: "phone"` or `npcType: "both"`
- Person-only NPCs should NOT be in this array

### NPCs Array (Location)
```json
{
  "scenario_brief": "Your mission...",
  "startRoom": "lobby",
  "startItemsInInventory": [ /* ... */ ],
  "npcs": [
    /* NPC configurations here */
  ],
  "rooms": { /* ... */ }
}
```

The `npcs` array is at the root level of the scenario JSON, alongside `rooms`, `startRoom`, etc.

## Validation Rules

### Required Fields by Type

#### For `npcType: "phone"`
- ✅ Required: `id`, `displayName`, `npcType`, `phoneId`, `storyPath`
- ⚠️ Optional: `avatar`, `eventMappings`, `timedMessages`
- ❌ Not used: `roomId`, `position`, `spriteSheet`, `spriteConfig`

#### For `npcType: "person"`
- ✅ Required: `id`, `displayName`, `npcType`, `roomId`, `position`, `storyPath`
- ⚠️ Optional: `spriteSheet`, `spriteConfig`, `direction`, `interactionDistance`
- ❌ Not used: `phoneId`, `avatar` (phone-specific)

#### For `npcType: "both"`
- ✅ Required: `id`, `displayName`, `npcType`, `phoneId`, `roomId`, `position`, `storyPath`
- ⚠️ Optional: `avatar`, `spriteSheet`, `spriteConfig`, `direction`, `interactionDistance`, `eventMappings`, `timedMessages`

### Position Validation
```javascript
function validateNPCPosition(npc) {
  if (npc.npcType === 'person' || npc.npcType === 'both') {
    if (!npc.position) {
      throw new Error(`NPC ${npc.id} requires position property`);
    }
    
    const hasGridPos = npc.position.x !== undefined && npc.position.y !== undefined;
    const hasPixelPos = npc.position.px !== undefined && npc.position.py !== undefined;
    
    if (!hasGridPos && !hasPixelPos) {
      throw new Error(`NPC ${npc.id} position must have either {x, y} or {px, py}`);
    }
  }
}
```

### Room Existence Validation
```javascript
function validateNPCRoom(npc, scenario) {
  if (npc.npcType === 'person' || npc.npcType === 'both') {
    if (!scenario.rooms[npc.roomId]) {
      console.warn(`NPC ${npc.id} references non-existent room: ${npc.roomId}`);
    }
  }
}
```

### Phone Existence Validation
```javascript
function validateNPCPhone(npc, scenario) {
  if (npc.npcType === 'phone' || npc.npcType === 'both') {
    const phones = scenario.startItemsInInventory.filter(item => item.type === 'phone');
    const phone = phones.find(p => p.phoneId === npc.phoneId);
    
    if (!phone) {
      console.warn(`NPC ${npc.id} references non-existent phone: ${npc.phoneId}`);
    } else if (!phone.npcIds.includes(npc.id)) {
      console.warn(`NPC ${npc.id} not listed in phone ${npc.phoneId}'s npcIds array`);
    }
  }
}
```

## Migration Guide

### Converting Phone NPC to Dual-Identity

**Before (Phone Only):**
```json
{
  "id": "helper",
  "displayName": "Helpful Contact",
  "npcType": "phone",
  "phoneId": "player_phone",
  "storyPath": "scenarios/ink/helper.json"
}
```

**After (Dual Identity):**
```json
{
  "id": "helper",
  "displayName": "Helpful Contact",
  "npcType": "both",
  "phoneId": "player_phone",
  "roomId": "office1",
  "position": { "x": 6, "y": 4 },
  "spriteSheet": "hacker",
  "storyPath": "scenarios/ink/helper.json"
}
```

### Scenario Conversion Checklist
- [ ] Update `npcType` from `"phone"` to `"both"`
- [ ] Add `roomId` property (choose appropriate room)
- [ ] Add `position` property (choose tile coordinates)
- [ ] Add `spriteSheet` property (typically `"hacker"`)
- [ ] Optionally add `spriteConfig` for animations
- [ ] Update Ink story to handle dual contexts (see 03_DUAL_IDENTITY.md)
- [ ] Test both phone and in-person interactions

## Default Values

### Applied by NPCManager
```javascript
const DEFAULT_NPC_CONFIG = {
  npcType: 'phone',              // Backward compatible
  spriteSheet: 'hacker',         // Default character sprite
  interactionDistance: 80,       // 80 pixels
  direction: 'down',             // Facing down
  scale: 1,                      // Normal size
  spriteConfig: {
    idleFrameStart: 20,
    idleFrameEnd: 23,
    frameRate: 4
  },
  canMove: false,                // Static NPCs initially
  currentKnot: 'start'           // Default starting knot
};
```

## Advanced Features (Future)

### Patrol Routes
```json
{
  "id": "patrolling_guard",
  "npcType": "person",
  "roomId": "hallway",
  "position": { "x": 5, "y": 5 },
  "canMove": true,
  "patrolRoute": [
    { "x": 5, "y": 5, "wait": 2000 },
    { "x": 10, "y": 5, "wait": 1000 },
    { "x": 10, "y": 10, "wait": 2000 },
    { "x": 5, "y": 10, "wait": 1000 }
  ]
}
```

### Dynamic Relocation
```json
{
  "id": "mobile_character",
  "npcType": "both",
  "roomId": "office1",
  "position": { "x": 5, "y": 5 },
  "relocations": [
    {
      "condition": "player_completed_task_1",
      "newRoomId": "office2",
      "newPosition": { "x": 8, "y": 3 }
    }
  ]
}
```

### Multiple Sprite Sheets
```json
{
  "id": "character_variants",
  "npcType": "person",
  "roomId": "lobby",
  "position": { "x": 5, "y": 5 },
  "spriteVariants": {
    "default": "hacker",
    "disguised": "guard_uniform",
    "injured": "hacker_wounded"
  },
  "currentVariant": "default"
}
```

## Complete Scenario Example

### Full scenario with phone and person NPCs
```json
{
  "scenario_brief": "Infiltrate the office and gather evidence",
  "startRoom": "lobby",
  
  "startItemsInInventory": [
    {
      "type": "phone",
      "name": "Your Phone",
      "takeable": true,
      "phoneId": "player_phone",
      "npcIds": ["remote_contact", "tech_support"],
      "observations": "Your phone with secure contacts"
    }
  ],
  
  "npcs": [
    {
      "id": "remote_contact",
      "displayName": "Anonymous Tipster",
      "npcType": "phone",
      "phoneId": "player_phone",
      "avatar": "assets/npc/avatars/npc_neutral.png",
      "storyPath": "scenarios/ink/tipster.json",
      "timedMessages": [
        {
          "delay": 10000,
          "message": "Have you reached the office yet?",
          "type": "text"
        }
      ]
    },
    {
      "id": "tech_support",
      "displayName": "Alex the Sysadmin",
      "npcType": "both",
      "phoneId": "player_phone",
      "avatar": "assets/npc/avatars/npc_helper.png",
      "roomId": "server_room",
      "position": { "x": 8, "y": 5 },
      "spriteSheet": "hacker",
      "spriteConfig": {
        "idleFrameStart": 20,
        "idleFrameEnd": 23,
        "talkFrameStart": 28,
        "talkFrameEnd": 31
      },
      "storyPath": "scenarios/ink/alex.json",
      "eventMappings": [
        {
          "eventPattern": "item_picked_up:keycard",
          "targetKnot": "on_keycard_found",
          "onceOnly": true
        }
      ]
    },
    {
      "id": "security_guard",
      "displayName": "Security Guard",
      "npcType": "person",
      "roomId": "lobby",
      "position": { "x": 5, "y": 3 },
      "spriteSheet": "hacker",
      "storyPath": "scenarios/ink/guard.json",
      "direction": "right"
    }
  ],
  
  "rooms": {
    "lobby": {
      "type": "room_lobby",
      "connections": { "north": "hallway" }
    },
    "server_room": {
      "type": "room_servers",
      "connections": { "south": "hallway" }
    }
  }
}
```

## TypeScript Type Definitions (Reference)

For developers working in TypeScript:

```typescript
type NPCType = "phone" | "person" | "both";

interface NPCPosition {
  x?: number;
  y?: number;
  px?: number;
  py?: number;
}

interface SpriteConfig {
  idleFrame?: number;
  idleFrameStart?: number;
  idleFrameEnd?: number;
  greetFrameStart?: number;
  greetFrameEnd?: number;
  talkFrameStart?: number;
  talkFrameEnd?: number;
  animPrefix?: string;
  frameRate?: number;
}

interface EventMapping {
  eventPattern: string;
  targetKnot: string;
  cooldown?: number;
  maxTriggers?: number;
  onceOnly?: boolean;
  condition?: string;
}

interface TimedMessage {
  delay: number;
  message: string;
  type: string;
}

interface NPC {
  id: string;
  displayName: string;
  npcType: NPCType;
  storyPath: string;
  
  // Phone properties
  phoneId?: string;
  avatar?: string;
  
  // Person properties
  roomId?: string;
  position?: NPCPosition;
  spriteSheet?: string;
  spriteConfig?: SpriteConfig;
  interactionDistance?: number;
  direction?: "up" | "down" | "left" | "right";
  scale?: number;
  
  // Behavior
  currentKnot?: string;
  eventMappings?: EventMapping[];
  timedMessages?: TimedMessage[];
}
```

## Validation Utility Script

```javascript
// scripts/validate-npc-config.js

function validateScenarioNPCs(scenario) {
  const errors = [];
  const warnings = [];
  
  if (!scenario.npcs || !Array.isArray(scenario.npcs)) {
    errors.push('Scenario must have npcs array');
    return { errors, warnings };
  }
  
  scenario.npcs.forEach(npc => {
    // Required fields
    if (!npc.id) errors.push(`NPC missing id`);
    if (!npc.displayName) errors.push(`NPC ${npc.id} missing displayName`);
    if (!npc.npcType) errors.push(`NPC ${npc.id} missing npcType`);
    if (!npc.storyPath) errors.push(`NPC ${npc.id} missing storyPath`);
    
    // Type-specific validation
    if (npc.npcType === 'phone' || npc.npcType === 'both') {
      if (!npc.phoneId) {
        errors.push(`NPC ${npc.id} type "${npc.npcType}" requires phoneId`);
      }
    }
    
    if (npc.npcType === 'person' || npc.npcType === 'both') {
      if (!npc.roomId) {
        errors.push(`NPC ${npc.id} type "${npc.npcType}" requires roomId`);
      }
      if (!npc.position) {
        errors.push(`NPC ${npc.id} type "${npc.npcType}" requires position`);
      } else {
        const hasGrid = npc.position.x !== undefined && npc.position.y !== undefined;
        const hasPixel = npc.position.px !== undefined && npc.position.py !== undefined;
        if (!hasGrid && !hasPixel) {
          errors.push(`NPC ${npc.id} position must have {x, y} or {px, py}`);
        }
      }
      
      // Check room exists
      if (npc.roomId && !scenario.rooms[npc.roomId]) {
        warnings.push(`NPC ${npc.id} room "${npc.roomId}" not found in scenario`);
      }
    }
  });
  
  return { errors, warnings };
}
```

## Next Steps
1. Update NPCManager to parse new properties
2. Create validation utility
3. Update ceo_exfil.json as test scenario
4. Document in NPC_INTEGRATION_GUIDE.md
5. Add TypeScript definitions if using TS
