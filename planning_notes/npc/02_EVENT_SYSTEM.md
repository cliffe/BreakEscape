# NPC Event System Design

## Overview

The Event System bridges game actions with Ink-based NPC responses. It listens for player activities and triggers appropriate Ink knots to generate bark notifications or update conversation states.

## Event Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Game Actions                               │
│  Player moves, interacts, picks up items, completes minigames   │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                Event Dispatcher (NEW)                            │
│  - Central event bus for NPC-relevant actions                    │
│  - Filters and categorizes events                                │
│  - Debounces rapid-fire events                                   │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                Event Processor (NEW)                             │
│  - Matches events to Ink knots via mapping config               │
│  - Checks conditions (cooldowns, prerequisites, etc.)            │
│  - Prioritizes multiple simultaneous events                      │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Ink Engine                                      │
│  - Executes triggered knots                                      │
│  - Returns dialogue/choices                                      │
│  - Updates NPC conversation state                                │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│             Bark/Phone Chat System                               │
│  - Shows notification for barks                                  │
│  - Updates phone chat history                                    │
│  - Marks conversations as having new messages                    │
└─────────────────────────────────────────────────────────────────┘
```

## Event Types

### 1. Room Events
Triggered when player moves between rooms:

```javascript
{
  type: 'room_entered',
  roomId: 'reception',
  previousRoom: null,
  timestamp: 1234567890,
  firstVisit: true
}

{
  type: 'room_exited',
  roomId: 'office1',
  nextRoom: 'reception',
  timestamp: 1234567890,
  timeSpentInRoom: 45 // seconds
}
```

**Ink Knot Naming:** `{npc}_room_{room_id}`
**Example:** `alice_room_reception`, `bob_room_server`

### 2. Item Events
Triggered when player interacts with items:

```javascript
{
  type: 'item_picked_up',
  itemType: 'lockpick',
  itemName: 'Lockpick',
  roomId: 'reception',
  timestamp: 1234567890
}

{
  type: 'item_used',
  itemType: 'keycard',
  target: 'door_lab',
  success: true,
  timestamp: 1234567890
}

{
  type: 'item_examined',
  itemType: 'notes',
  itemName: 'Security Log',
  timestamp: 1234567890
}
```

**Ink Knot Naming:** `{npc}_item_{item_type}`
**Example:** `alice_item_lockpick`, `bob_item_keycard`

### 3. Door Events
Triggered when player interacts with doors:

```javascript
{
  type: 'door_unlocked',
  doorId: 'door_reception_office1',
  method: 'biometric', // or 'key', 'lockpicking', 'password'
  roomFrom: 'reception',
  roomTo: 'office1',
  timestamp: 1234567890
}

{
  type: 'door_locked',
  doorId: 'door_lab',
  timestamp: 1234567890
}

{
  type: 'door_attempt_failed',
  doorId: 'door_server',
  reason: 'missing_biometric',
  timestamp: 1234567890
}
```

**Ink Knot Naming:** `{npc}_door_{action}_{room_to}`
**Example:** `alice_door_unlocked_lab`, `bob_door_failed_server`

### 4. Minigame Events
Triggered when player completes (or fails) minigames:

```javascript
{
  type: 'minigame_completed',
  minigame: 'lockpicking',
  success: true,
  target: 'safe',
  score: 85,
  duration: 32, // seconds
  timestamp: 1234567890
}

{
  type: 'minigame_started',
  minigame: 'dusting',
  target: 'keyboard',
  timestamp: 1234567890
}

{
  type: 'minigame_failed',
  minigame: 'password',
  attempts: 3,
  timestamp: 1234567890
}
```

**Ink Knot Naming:** `{npc}_minigame_{type}_{result}`
**Example:** `alice_minigame_lockpicking_success`, `bob_minigame_password_failed`

### 5. Interaction Events
Triggered when player interacts with objects:

```javascript
{
  type: 'object_interacted',
  objectType: 'pc',
  objectName: 'Lab Computer',
  action: 'examined',
  roomId: 'office1',
  timestamp: 1234567890
}

{
  type: 'fingerprint_collected',
  owner: 'researcher',
  quality: 'excellent',
  location: 'keyboard',
  timestamp: 1234567890
}

{
  type: 'bluetooth_device_found',
  deviceName: 'Lab Tablet',
  deviceMac: 'AA:BB:CC:DD:EE:FF',
  roomId: 'lab',
  timestamp: 1234567890
}
```

**Ink Knot Naming:** `{npc}_interaction_{object_type}`
**Example:** `alice_interaction_pc`, `bob_interaction_bluetooth`

### 6. Progress Events
Triggered when player makes significant story progress:

```javascript
{
  type: 'objective_completed',
  objective: 'find_fingerprint',
  timestamp: 1234567890
}

{
  type: 'suspect_identified',
  suspect: 'research_director',
  method: 'fingerprint_match',
  timestamp: 1234567890
}

{
  type: 'mission_phase_changed',
  from: 1,
  to: 2,
  timestamp: 1234567890
}
```

**Ink Knot Naming:** `{npc}_progress_{milestone}`
**Example:** `alice_progress_suspect_found`, `bob_progress_phase2`

### 7. Time Events
Triggered at specific game time milestones:

```javascript
{
  type: 'time_elapsed',
  totalSeconds: 300, // 5 minutes
  timestamp: 1234567890
}

{
  type: 'time_threshold',
  threshold: 'slow', // or 'fast', 'normal'
  totalSeconds: 600,
  timestamp: 1234567890
}
```

**Ink Knot Naming:** `{npc}_time_{threshold}`
**Example:** `alice_time_slow`, `bob_time_fast`

## Event Configuration

### Scenario-Level Event Mapping

In scenario JSON, define which events trigger which NPCs:

```json
{
  "scenario_brief": "...",
  "npcs": {
    "alice": {
      "name": "Alice Chen",
      "role": "Security Analyst",
      "phone": "555-0123",
      "avatar": "npc_alice.png",
      "inkFile": "scenarios/compiled/biometric_breach.json",
      "initialKnot": "alice_intro",
      "eventMappings": {
        "room_entered:reception": "alice_room_reception",
        "room_entered:lab": "alice_room_lab",
        "item_picked_up:fingerprint_kit": "alice_item_fingerprint_kit",
        "minigame_completed:lockpicking:success": "alice_minigame_lockpicking_success",
        "door_unlocked:office1": "alice_door_unlocked_office1",
        "progress:suspect_identified": "alice_progress_suspect_found"
      }
    },
    "bob": {
      "name": "Bob Martinez",
      "role": "IT Administrator",
      "phone": "555-0124",
      "avatar": "npc_bob.png",
      "inkFile": "scenarios/compiled/biometric_breach.json",
      "initialKnot": "bob_intro",
      "eventMappings": {
        "room_entered:server": "bob_room_server",
        "item_used:keycard": "bob_item_keycard",
        "minigame_failed:password": "bob_minigame_password_failed"
      }
    }
  }
}
```

### Event Mapping Format

**Pattern:** `{event_type}:{specifier}:{optional_result}`

**Examples:**
- `room_entered:reception` - Player enters reception
- `item_picked_up:lockpick` - Player picks up lockpick
- `minigame_completed:lockpicking:success` - Player succeeds at lockpicking
- `door_unlocked:lab` - Any method of unlocking lab door
- `progress:suspect_identified` - Story milestone reached

### Wildcard Mappings

```json
"eventMappings": {
  "room_entered:*": "alice_any_room",           // Any room entry
  "item_picked_up:*": "alice_any_item",         // Any item pickup
  "minigame_completed:*:success": "alice_any_success", // Any minigame success
  "minigame_completed:*:failed": "alice_any_failure"   // Any minigame failure
}
```

## Event Filtering & Conditions

### Cooldowns
Prevent spam by limiting event frequency:

```json
{
  "alice": {
    "cooldowns": {
      "room_entered": 10,        // Max once per 10 seconds
      "item_picked_up": 5,       // Max once per 5 seconds
      "default": 3               // Default for unmapped events
    }
  }
}
```

### Prerequisites
Only trigger events if conditions are met:

```json
{
  "alice": {
    "prerequisites": {
      "alice_room_lab": {
        "requires": ["player_met_alice"],     // Must have triggered intro
        "minRoomCount": 2,                     // Must have visited 2+ rooms
        "minGameTime": 60                      // Must have played 60+ seconds
      }
    }
  }
}
```

### Priority System
When multiple events trigger simultaneously:

```json
{
  "alice": {
    "priorities": {
      "progress": 100,           // Story progress = highest priority
      "minigame_completed": 80,  
      "door_unlocked": 60,
      "item_picked_up": 40,
      "room_entered": 20         // Room entries = lowest priority
    }
  }
}
```

## Implementation Details

### Event Dispatcher (`js/systems/npc-events.js`)

```javascript
class NPCEventDispatcher {
  constructor() {
    this.listeners = [];
    this.eventQueue = [];
    this.cooldowns = new Map(); // Track last trigger time per event
    this.isProcessing = false;
  }

  // Register event listener
  on(eventType, callback) {
    this.listeners.push({ eventType, callback });
  }

  // Emit an event
  emit(eventType, eventData) {
    const event = {
      type: eventType,
      data: eventData,
      timestamp: Date.now()
    };
    
    // Add to queue
    this.eventQueue.push(event);
    
    // Process queue
    this.processQueue();
  }

  // Process queued events
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      
      // Check cooldown
      if (this.isOnCooldown(event)) {
        continue;
      }
      
      // Notify listeners
      for (const listener of this.listeners) {
        if (this.matchesPattern(event.type, listener.eventType)) {
          await listener.callback(event);
        }
      }
      
      // Update cooldown
      this.updateCooldown(event);
    }

    this.isProcessing = false;
  }

  isOnCooldown(event) {
    const key = `${event.type}:${JSON.stringify(event.data)}`;
    const lastTrigger = this.cooldowns.get(key);
    
    if (!lastTrigger) return false;
    
    const cooldownDuration = this.getCooldownDuration(event.type);
    return (Date.now() - lastTrigger) < cooldownDuration * 1000;
  }

  updateCooldown(event) {
    const key = `${event.type}:${JSON.stringify(event.data)}`;
    this.cooldowns.set(key, Date.now());
  }

  getCooldownDuration(eventType) {
    // Get from NPC config or use default
    return window.npcConfig?.cooldowns?.[eventType] || 5;
  }

  matchesPattern(eventType, pattern) {
    if (pattern === '*') return true;
    if (pattern === eventType) return true;
    
    // Support wildcards like "room_entered:*"
    const patternParts = pattern.split(':');
    const eventParts = eventType.split(':');
    
    if (patternParts.length !== eventParts.length) return false;
    
    return patternParts.every((part, i) => 
      part === '*' || part === eventParts[i]
    );
  }
}

// Global instance
window.npcEvents = new NPCEventDispatcher();
```

### Game Integration Points

#### In `js/core/rooms.js` (Room Transitions)
```javascript
export function updatePlayerRoom() {
  // ... existing room detection code ...
  
  if (window.currentPlayerRoom !== previousRoom) {
    // Emit NPC event
    if (window.npcEvents) {
      window.npcEvents.emit('room_entered', {
        roomId: window.currentPlayerRoom,
        previousRoom: previousRoom,
        timestamp: Date.now(),
        firstVisit: !window.discoveredRooms.has(window.currentPlayerRoom)
      });
    }
  }
}
```

#### In `js/systems/inventory.js` (Item Pickup)
```javascript
export function addToInventory(item) {
  // ... existing inventory code ...
  
  // Emit NPC event
  if (window.npcEvents) {
    window.npcEvents.emit('item_picked_up', {
      itemType: item.type,
      itemName: item.name,
      roomId: window.currentPlayerRoom,
      timestamp: Date.now()
    });
  }
}
```

#### In `js/systems/interactions.js` (Door Unlocking)
```javascript
function unlockDoor(doorSprite, method) {
  // ... existing unlock code ...
  
  // Emit NPC event
  if (window.npcEvents) {
    window.npcEvents.emit('door_unlocked', {
      doorId: doorSprite.name,
      method: method,
      roomFrom: window.currentPlayerRoom,
      roomTo: doorSprite.scenarioData.target,
      timestamp: Date.now()
    });
  }
}
```

#### In Minigame Framework (Completion)
```javascript
// In MinigameFramework.endMinigame()
if (window.npcEvents) {
  window.npcEvents.emit('minigame_completed', {
    minigame: this.currentMinigame.type,
    success: success,
    result: result,
    timestamp: Date.now()
  });
}
```

## Event Response Flow

```
1. Game Action Occurs
   └─> Event emitted via window.npcEvents.emit()
   
2. Event Dispatcher receives event
   └─> Checks cooldown
   └─> Adds to priority queue
   
3. Event Processor (NPC Manager)
   └─> Matches event to NPC mappings
   └─> Checks prerequisites
   └─> Determines which NPCs should respond
   
4. For each responding NPC:
   └─> Ink Engine executes mapped knot
   └─> Generates dialogue/choices
   └─> Returns to Bark/Chat system
   
5. Bark System
   └─> Shows notification if type=bark
   └─> Adds to phone chat history
   └─> Marks conversation as updated
```

## Testing & Debugging

### Event Log Console
```javascript
// Enable debug mode
window.npcEvents.debug = true;

// All events logged to console:
// [NPC Event] room_entered:reception -> alice_room_reception (cooldown: OK)
// [NPC Event] item_picked_up:lockpick -> (cooldown: SKIP, 3s remaining)
```

### Manual Event Triggering
```javascript
// For testing in browser console
window.npcEvents.emit('room_entered', {
  roomId: 'lab',
  previousRoom: 'reception',
  timestamp: Date.now(),
  firstVisit: true
});
```

### Event History Viewer
```javascript
// Show last 50 events
window.npcEvents.getHistory(50);

// Show events for specific NPC
window.npcEvents.getHistoryForNPC('alice');
```

## Next Steps

See `03_PHONE_UI.md` for how these events translate into the player-facing phone chat interface.
