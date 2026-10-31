# Server-Side API Specification for Break Escape
## Supporting Lazy-Loading and Streaming Game Content

**Date**: November 6, 2025  
**Status**: Phase 4 Planning  
**Audience**: Backend developers, API designers, system architects  

---

## Overview

This specification defines REST API endpoints that enable Break Escape to work with a server that delivers game content on-demand. This supports:

1. **Streaming Game Content**: Load scenarios incrementally as player explores
2. **Dynamic Game Worlds**: Modify rooms/NPCs based on player progress
3. **Persistent State**: Save/load conversation and game progress
4. **Multiplayer Foundation**: Shared world state, other players visible

---

## Architecture Context

### Current (Client-Side Monolithic)

```
Browser loads scenario.json (entire game)
         ↓
Phaser game initializes with full game state
         ↓
Player explores (no network needed)
```

### Target (Server-Client)

```
Browser requests /game/{gameId}/start
         ↓
Server returns initial scenario + first room data
         ↓
Browser renders first room
         ↓
Player enters new room
         ↓
Browser requests /game/{gameId}/room/{roomId}
         ↓
Server returns room data + NPCs
         ↓
Browser renders new room + creates NPC sprites
```

---

## API Endpoints

### 1. Game Initialization

#### `POST /api/game/start`

Start a new game session.

**Request**:
```json
{
  "scenarioId": "ceo_exfil",
  "playerId": "player@example.com",
  "difficulty": "normal",
  "options": {
    "tutorialEnabled": true,
    "soundEnabled": true
  }
}
```

**Response**: `200 OK`
```json
{
  "gameId": "game-uuid-12345",
  "scenarioId": "ceo_exfil",
  "startRoom": "reception",
  "scenario": {
    "scenario_brief": "...",
    "startItemsInInventory": [...],
    "npcs": [
      {
        "id": "neye_eve",
        "npcType": "phone",
        "phoneId": "player_phone",
        "displayName": "Neye Eve",
        "storyPath": "scenarios/ink/neye-eve.json",
        "currentKnot": "start"
      }
    ]
  },
  "player": {
    "displayName": "Agent 0x00",
    "spriteSheet": "hacker"
  },
  "initialRoom": {
    "id": "reception",
    "type": "room_reception",
    "npcs": [
      {
        "id": "desk_clerk",
        "displayName": "Clerk",
        "npcType": "person",
        "position": { "x": 5, "y": 3 },
        "spriteSheet": "hacker-red",
        "storyPath": "scenarios/ink/clerk.json",
        "currentKnot": "start"
      }
    ],
    "objects": [...]
  },
  "gameState": {
    "startTime": "2025-11-06T10:00:00Z",
    "currentRoom": "reception",
    "inventory": []
  }
}
```

**Error Responses**:
- `400 Bad Request`: Missing/invalid scenarioId
- `404 Not Found`: Scenario not found on server
- `429 Too Many Requests`: Rate limited

---

### 2. Scenario Data

#### `GET /api/game/{gameId}/scenario`

Get full scenario data (backward compatibility).

**Query Parameters**:
- `include`: Comma-separated list of sections to include
  - Values: `npcs,rooms,items,objectives`
  - Default: all

**Response**: `200 OK`
```json
{
  "scenarioId": "ceo_exfil",
  "scenario_brief": "...",
  "startRoom": "reception",
  "npcs": [...],
  "rooms": {...},
  "startItemsInInventory": [...]
}
```

**Note**: Used for full scenario preload or caching.

---

### 3. Room Data

#### `GET /api/game/{gameId}/room/{roomId}`

Get room data with all its NPCs and objects.

**Query Parameters**:
- `includeAssets`: Include sprite/story URLs (default: true)
- `depth`: Include connected rooms (0-2, default: 0)

**Response**: `200 OK`
```json
{
  "id": "reception",
  "type": "room_reception",
  "connections": {
    "north": "office1",
    "east": "office3"
  },
  "locked": false,
  "lockType": null,
  "npcs": [
    {
      "id": "desk_clerk",
      "displayName": "Clerk",
      "npcType": "person",
      "position": { "x": 5, "y": 3 },
      "spriteSheet": "hacker-red",
      "spriteTalk": "assets/characters/hacker-red-talk.png",
      "spriteConfig": {
        "idleFrameStart": 20,
        "idleFrameEnd": 23
      },
      "storyPath": "scenarios/ink/clerk.json",
      "currentKnot": "start"
    }
  ],
  "objects": [
    {
      "id": "reception_desk",
      "type": "pc",
      "name": "Reception Computer",
      "x": 10,
      "y": 20,
      "locked": true,
      "lockType": "password",
      "requires": "secret123",
      "contents": [...]
    }
  ]
}
```

**Error Responses**:
- `404 Not Found`: Room not found
- `403 Forbidden`: Player hasn't unlocked this room

---

#### `GET /api/game/{gameId}/room/{roomId}/summary`

Get lightweight room metadata without full object data.

**Response**: `200 OK`
```json
{
  "id": "reception",
  "type": "room_reception",
  "hasNPCs": true,
  "npcCount": 1,
  "locked": false,
  "discoveredBy": "player",
  "visited": false
}
```

**Use**: Client can prefetch room connectivity without full data.

---

### 4. NPC Data

#### `GET /api/game/{gameId}/npc/{npcId}`

Get individual NPC data.

**Response**: `200 OK`
```json
{
  "id": "desk_clerk",
  "displayName": "Clerk",
  "roomId": "reception",
  "npcType": "person",
  "position": { "x": 5, "y": 3 },
  "spriteSheet": "hacker-red",
  "spriteTalk": "assets/characters/hacker-red-talk.png",
  "storyPath": "scenarios/ink/clerk.json",
  "currentKnot": "start",
  "eventMappings": [],
  "metadata": {
    "role": "receptionist",
    "mood": "neutral"
  }
}
```

---

#### `GET /api/game/{gameId}/npc/{npcId}/story`

Get Ink story file for an NPC.

**Response**: `200 OK`
```json
{
  "inkVersion": 21,
  "root": [...],
  "listDefs": {},
  "includeStory": []
}
```

**Cache**: Client should cache per game session (stories don't change).

---

#### `POST /api/game/{gameId}/npc/{npcId}/dialogue`

Continue NPC dialogue after player choice.

**Request**:
```json
{
  "storyState": "{ serialized Ink state }",
  "choiceIndex": 0
}
```

**Response**: `200 OK`
```json
{
  "text": "Next dialogue text",
  "choices": [
    { "index": 0, "text": "Choice 1" },
    { "index": 1, "text": "Choice 2" }
  ],
  "variables": { "reputation": 5 },
  "tags": ["end_conversation"]
}
```

---

### 5. Game State

#### `GET /api/game/{gameId}/state`

Get current game state.

**Response**: `200 OK`
```json
{
  "gameId": "game-uuid-12345",
  "currentRoom": "reception",
  "inventory": [
    {
      "id": "lockpick",
      "type": "lockpick",
      "name": "Lock Pick Kit"
    }
  ],
  "gameState": {
    "biometricSamples": [],
    "bluetoothDevices": [],
    "notes": [],
    "startTime": "2025-11-06T10:00:00Z",
    "elapsedSeconds": 125
  },
  "roomsDiscovered": ["reception", "office1"],
  "objectives": {
    "primary": "Find evidence of corporate espionage",
    "secondary": [...]
  }
}
```

---

#### `PUT /api/game/{gameId}/state`

Update game state (checkpoint/save).

**Request**:
```json
{
  "currentRoom": "reception",
  "inventory": [...],
  "gameState": {...},
  "roomsDiscovered": [...],
  "npcStates": {
    "desk_clerk": { "lastKnot": "end", "vars": {...} }
  }
}
```

**Response**: `200 OK`
```json
{
  "saved": true,
  "checkpoint": "auto-save-123",
  "timestamp": "2025-11-06T10:05:00Z"
}
```

---

### 6. Room State Updates

#### `POST /api/game/{gameId}/room/{roomId}/unlock`

Unlock a room (via puzzle completion, key, etc.).

**Request**:
```json
{
  "unlockMethod": "key",
  "key_id": "office1_key"
}
```

**Response**: `200 OK`
```json
{
  "roomId": "office1",
  "unlocked": true,
  "newObjects": [],
  "npcChanges": [
    {
      "action": "appear",
      "npcId": "new_contact",
      "roomId": "office1"
    }
  ]
}
```

---

#### `POST /api/game/{gameId}/room/{roomId}/interact`

Perform an interaction in a room.

**Request**:
```json
{
  "objectId": "reception_desk",
  "action": "unlock",
  "data": { "method": "password", "answer": "secret123" }
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "objectId": "reception_desk",
  "message": "Unlocked successfully",
  "rewards": [
    { "type": "item", "id": "document", "name": "Secret Document" }
  ],
  "triggers": []
}
```

---

### 7. Events & Triggers

#### `POST /api/game/{gameId}/event`

Send game event to server for logging/triggering.

**Request**:
```json
{
  "eventType": "item_picked_up",
  "data": {
    "itemId": "lockpick",
    "roomId": "reception"
  }
}
```

**Response**: `200 OK`
```json
{
  "received": true,
  "npcReactions": [
    {
      "npcId": "helper_npc",
      "action": "message",
      "text": "Nice! You got the lockpick!"
    }
  ],
  "worldChanges": [
    {
      "type": "room_update",
      "roomId": "office1",
      "changes": { "locked": false }
    }
  ]
}
```

**Supported Events**:
- `item_picked_up`: Player collected item
- `door_unlocked`: Room became accessible
- `minigame_completed`: Puzzle/game completed
- `minigame_failed`: Puzzle failed
- `npc_talked`: Conversation started
- `objective_completed`: Major objective done
- `room_entered`: Player entered room
- `room_discovered`: Player first discovered room

---

### 8. Assets & Resources

#### `GET /api/game/{gameId}/assets/{assetType}/{assetId}`

Get game asset (sprite, story, sound).

**URL Examples**:
- `/api/game/{gameId}/assets/sprite/hacker-red`
- `/api/game/{gameId}/assets/story/clerk`
- `/api/game/{gameId}/assets/sound/unlock-door`

**Response**: Depends on asset type
- Sprite: PNG/WebP image
- Story: JSON Ink story
- Sound: MP3/WAV audio

---

## Data Models

### NPC Object

```typescript
interface NPC {
  id: string;                          // Unique identifier
  displayName: string;                 // Display name
  npcType: "phone" | "person" | "both"; // Type
  
  // For person NPCs
  roomId?: string;                     // Room ID (if person)
  position?: {
    x: number;
    y: number;
  };
  spriteSheet: string;                 // Sprite asset name
  spriteConfig?: {
    idleFrameStart: number;
    idleFrameEnd: number;
  };
  spriteTalk?: string;                 // Talk sprite URL
  
  // For phone NPCs
  phoneId?: string;                    // Phone device ID
  avatar?: string;                     // Avatar image URL
  
  // Story/Dialogue
  storyPath: string;                   // Path to Ink story
  currentKnot: string;                 // Starting knot
  
  // Events
  eventMappings?: EventMapping[];
  timedMessages?: TimedMessage[];
  
  // Metadata
  metadata?: Record<string, any>;
}

interface EventMapping {
  eventPattern: string;                // Glob pattern (e.g., "item_picked_up:*")
  targetKnot: string;                  // Knot to jump to
  condition?: string;                  // Optional JS condition
  cooldown?: number;                   // Milliseconds before can trigger again
  onceOnly?: boolean;                  // Only trigger once
}

interface TimedMessage {
  delay: number;                       // Milliseconds from game start
  message: string;                     // Message text
  type?: "text" | "speech";            // Message type
}
```

### Room Object

```typescript
interface Room {
  id: string;                          // Unique room ID
  type: string;                        // Room type/tileset
  connections: Record<string, string>; // { north: "room_id", ... }
  
  // Access control
  locked?: boolean;
  lockType?: string;                   // "key" | "password" | "pin" | ...
  requires?: string;                   // Key ID or code
  
  // Content
  npcs: NPC[];                         // NPCs in this room
  objects: GameObject[];               // Interactive objects
  
  // Metadata
  discovered?: boolean;                // Player has entered
  visited?: number;                    // Number of times visited
}

interface GameObject {
  id: string;
  type: string;                        // "pc" | "phone" | "safe" | ...
  name: string;
  x: number;                           // Grid X position
  y: number;                           // Grid Y position
  
  // Interaction
  locked?: boolean;
  lockType?: string;
  requires?: string;
  contents?: GameObject[];
  
  // Metadata
  metadata?: Record<string, any>;
}
```

### Game State

```typescript
interface GameState {
  gameId: string;
  scenarioId: string;
  playerId: string;
  
  currentRoom: string;
  inventory: InventoryItem[];
  
  // Game-specific state
  biometricSamples: BiometricSample[];
  bluetoothDevices: BluetoothDevice[];
  notes: Note[];
  
  // Progress tracking
  roomsDiscovered: Set<string>;
  objectsUnlocked: Set<string>;
  npcConversations: Record<string, NPCState>;
  
  // Time tracking
  startTime: Date;
  lastSaveTime?: Date;
  
  // Objectives
  objectives: Objective[];
}

interface InventoryItem {
  id: string;
  type: string;
  name: string;
  metadata?: Record<string, any>;
}

interface NPCState {
  npcId: string;
  lastKnot: string;
  storyState: string;                  // Serialized Ink state
  conversationHistory: DialogueLine[];
}

interface DialogueLine {
  type: "npc" | "player";
  text: string;
  timestamp: Date;
}
```

---

## Authentication & Authorization

### Auth Flow

```
Browser: POST /auth/login
  ↓
Server: Returns JWT token + refresh token
  ↓
Browser: Stores tokens in memory/localStorage
  ↓
Browser: Includes "Authorization: Bearer {token}" in all requests
  ↓
Server: Validates JWT, returns 401 if invalid
```

### Token Format

```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "sub": "player@example.com",
  "gameId": "game-uuid-12345",
  "iat": 1699246400,
  "exp": 1699250000,
  "scopes": ["play", "save", "chat"]
}
```

---

## Rate Limiting

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699246600
```

- **Per-game** requests: 100 per minute
- **Story loads**: 10 per minute
- **Dialogue**: 1 per second
- **Event posting**: 50 per minute

---

## Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "ROOM_LOCKED",
    "message": "Room is locked and requires a key",
    "details": {
      "roomId": "ceo_office",
      "lockType": "key",
      "requires": "ceo_office_key"
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (invalid/expired token) |
| 403 | Forbidden (not allowed this action) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |
| 503 | Service Unavailable |

---

## Performance Considerations

### Caching Strategy

**Client-side**:
- Cache Ink stories (never change per game)
- Cache room data for 30 seconds
- Cache sprite assets (long-lived)

**Server-side**:
- Cache room definitions (invalidate on edit)
- Cache scenario metadata
- Stream room state on demand

### Pagination

For large room objects:

```
GET /api/game/{gameId}/room/{roomId}/objects?page=1&size=50

Response:
{
  "objects": [...],
  "pagination": {
    "page": 1,
    "size": 50,
    "total": 123,
    "hasMore": true
  }
}
```

### Compression

- Enable gzip/brotli for JSON responses
- Use WebP for sprite assets
- Minify Ink story JSON

---

## Mock Server for Development

For local development without real server:

```javascript
// js/systems/mock-server.js

export class MockGameServer {
  async startGame(scenarioId) {
    // Return local scenario JSON
    const response = await fetch(`scenarios/${scenarioId}.json`);
    const scenario = await response.json();
    
    return {
      gameId: 'mock-game-' + Date.now(),
      scenario,
      startRoom: scenario.startRoom,
      initialRoom: scenario.rooms[scenario.startRoom]
    };
  }
  
  async getRoom(gameId, roomId) {
    // Return room from cached scenario
    const scenario = this.scenarios[gameId];
    return scenario.rooms[roomId];
  }
  
  // ... other methods
}
```

---

## Deployment Checklist

- [ ] API documentation (Swagger/OpenAPI)
- [ ] Authentication system (JWT)
- [ ] Database schema for game state
- [ ] Caching layer (Redis)
- [ ] Load testing (100+ concurrent games)
- [ ] Security audit (OWASP)
- [ ] Rate limiting implemented
- [ ] Error logging/monitoring
- [ ] CDN for static assets
- [ ] SSL/TLS certificates

---

## Future Enhancements

### Multi-Player Support

```
POST /api/game/{gameId}/players
  - Add co-op player to game
  - Sync state between players
  - Show other players in rooms
```

### Real-Time Events

```
WebSocket /ws/game/{gameId}
  - Server pushes NPC movements
  - Other player actions
  - Timed narrative events
```

### Analytics

```
POST /api/game/{gameId}/analytics
  - Track player behavior
  - Event flow analysis
  - Difficulty metrics
```

---

## References

- [JWT.io](https://jwt.io)
- [REST API Best Practices](https://restfulapi.net/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [HTTP Status Codes](https://httpwg.org/specs/rfc7231.html#status.codes)
