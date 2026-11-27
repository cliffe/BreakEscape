# NPC Behavior System - Implementation Plan

## Overview

This document outlines the implementation of a modular, maintainable NPC behavior system for Break Escape. The system will enable NPCs to exhibit dynamic behaviors including player awareness, patrolling, personal space maintenance, and hostility states.

**Key Architecture Points**:
- **Rooms never unload** - NPCs persist throughout the game session
- **Simple lifecycle** - Behaviors registered once when NPC sprite created
- **Real-time updates** - Depth calculated every frame for proper Y-sorting
- **Phaser physics** - Uses `immovable: true` (same as player)

## Goals

1. **Modular Design**: Separate behavior logic from sprite/animation management
2. **Scenario-Driven**: Behaviors configurable via scenario JSON
3. **Ink Integration**: Behavior states controllable through Ink tags
4. **Performance**: Efficient update cycles, minimal overhead
5. **Maintainability**: Clear separation of concerns, reusable patterns from player.js
6. **Extensible**: Easy to add new behaviors in the future

## Architecture

### Core Components

```
js/systems/
├── npc-manager.js          (existing - manages NPC data, Ink stories)
├── npc-sprites.js          (existing - sprite creation, animations)
├── npc-behavior.js         (NEW - behavior state machine & update loop)
└── npc-game-bridge.js      (existing - Ink→Game actions, extend for behavior)

Integration Points:
- js/core/game.js           (add behavior update to main game loop)
- scenarios/*.json          (add behavior config to NPC definitions)
```

### Data Flow

```
Scenario JSON → NPC Manager (registers NPCs)
    ↓
NPC Sprite Manager (creates sprites)
    ↓
NPC Behavior Manager (initializes behaviors)
    ↓
Game Update Loop → Behavior Update → State Transitions
    ↓
Ink Story Tags → Behavior State Changes (hostile, influence, etc.)
```

---

## Behavior State Machine

### States

Each NPC has one active behavior state at a time:

| State | Description | Priority |
|-------|-------------|----------|
| **idle** | Default standing/idle animation | 0 (lowest) |
| **face_player** | Turn towards player when in range | 1 |
| **patrol** | Random movement within area | 2 |
| **maintain_space** | Back away if player too close | 3 |
| **flee** | Run away from player (hostile fear) | 4 |
| **chase** | Move towards player (hostile aggression) | 5 (highest) |

**Priority System**: Higher priority states override lower priority states. For example, `maintain_space` overrides `patrol` and `face_player`.

### State Transitions

```
[Idle] ──player enters range──> [Face Player]
       ──patrol config enabled──> [Patrol]

[Face Player] ──player exits range──> [Idle]
              ──player too close + personalSpace──> [Maintain Space]

[Patrol] ──player in interaction range──> [Face Player]
         ──collision detected──> [change direction]
         ──stuck timer expires──> [random new direction]

[Maintain Space] ──player backs away──> [Face Player/Idle]
                 ──hostile tag received──> [Flee]

[Idle/Any] ──hostile tag + influence < 0──> [Flee]
           ──hostile tag + influence >= threshold──> [Chase]
```

---

## NPC Configuration Schema

### Scenario JSON Extensions

```json
{
  "rooms": {
    "room_id": {
      "npcs": [
        {
          "id": "guard_npc",
          "displayName": "Security Guard",
          "npcType": "person",
          "position": { "x": 5, "y": 3 },
          
          // ===== NEW BEHAVIOR FIELDS =====
          "behavior": {
            "facePlayer": true,              // Turn to face player when nearby (default: true)
            "facePlayerDistance": 96,         // Distance to start facing (default: 96px = 3 tiles)
            
            "patrol": {
              "enabled": false,               // Enable patrol mode (default: false)
              "speed": 100,                   // Movement speed px/s (default: 100, player is 150)
              "changeDirectionInterval": 3000, // Change direction every N ms (default: 3000)
              "bounds": {                     // Optional patrol area bounds
                "x": 0, "y": 0, "width": 320, "height": 288  // Relative to room
              }
            },
            
            "personalSpace": {
              "enabled": true,
              "distance": 48,                 // Minimum distance to maintain (default: 48px = 1.5 tiles)
              "backAwaySpeed": 30,            // Speed when backing away (default: 30 - slow)
              "backAwayDistance": 5           // Back away in 5px increments
            },
            
            "hostile": {
              "defaultState": false,          // Start hostile (default: false)
              "influenceThreshold": -50,      // Become hostile below this influence
              "chaseSpeed": 200,              // Speed when chasing (default: 200)
              "fleeSpeed": 180,               // Speed when fleeing (default: 180)
              "aggroDistance": 160            // Distance to start chase (default: 160px = 5 tiles)
            }
          },
          
          // Existing NPC fields...
          "spriteSheet": "guard",
          "storyPath": "scenarios/ink/guard.json",
          "currentKnot": "start"
        }
      ]
    }
  }
}
```

### Default Behavior

If `behavior` object is omitted, NPCs default to:
- `facePlayer: true` (turn towards player when nearby)
- All other behaviors disabled (idle when not facing player)

---

## Ink Tag Integration

### Tag Format

Ink stories can control NPC behavior state using tags:

```ink
=== confrontation ===
# hostile
# influence:-25
You've pushed me too far!
-> END

=== make_peace ===
# hostile:false
# influence:10
Okay, I forgive you.
-> hub

=== start_patrol ===
# patrol_mode:on
I'll be walking around if you need me.
-> hub

=== stop_patrol ===
# patrol_mode:off
I'll stay right here.
-> hub

=== personal_space_demo ===
# personal_space:96
Please keep your distance.
-> hub
```

### Tag Handlers (in npc-game-bridge.js)

| Tag | Effect | Example |
|-----|--------|---------|
| `#hostile` | Set NPC hostile state to true (red tint) | `# hostile` |
| `#hostile:false` | Set NPC hostile state to false | `# hostile:false` |
| `#influence:<value>` | Set NPC influence score | `# influence:-50` |
| `#patrol_mode:on` | Enable patrol behavior | `# patrol_mode:on` |
| `#patrol_mode:off` | Disable patrol behavior | `# patrol_mode:off` |
| `#personal_space:<px>` | Set personal space distance | `# personal_space:64` |

### Influence → Hostility Logic

The `influence` value (Ink VAR) automatically affects hostility:
- **influence >= 0**: Neutral/friendly
- **influence < influenceThreshold** (default -50): Hostile + flee
- **influence < influenceThreshold AND aggression high**: Hostile + chase

This is checked when `#influence` tags are processed.

---

## Implementation Details

### 1. npc-behavior.js Structure

```javascript
/**
 * NPCBehaviorManager - Manages all NPC behaviors
 * 
 * Initialized once in game.js create() phase
 * Updated every frame in game.js update() phase
 * 
 * IMPORTANT: Rooms never unload, so no lifecycle management needed.
 * Behaviors persist for entire game session once registered.
 */
export class NPCBehaviorManager {
  constructor(scene, npcManager) {
    this.scene = scene;              // Phaser scene reference
    this.npcManager = npcManager;     // NPC Manager reference
    this.behaviors = new Map();       // Map<npcId, NPCBehavior>
    this.updateInterval = 50;         // Update behaviors every 50ms
    this.lastUpdate = 0;
  }

  /**
   * Register a behavior instance for an NPC sprite
   * Called when NPC sprite is created in createNPCSpritesForRoom()
   * 
   * No unregister needed - rooms never unload, sprites persist
   */
  registerBehavior(npcId, sprite, config) {
    const behavior = new NPCBehavior(npcId, sprite, config, this.scene);
    this.behaviors.set(npcId, behavior);
  }

  /**
   * Main update loop (called from game.js update())
   */
  update(time, delta) {
    // Throttle updates to every 50ms for performance
    if (time - this.lastUpdate < this.updateInterval) return;
    this.lastUpdate = time;

    // Get player position once for all behaviors
    const player = window.player;
    if (!player) {
      return; // No player yet
    }
    const playerPos = { x: player.x, y: player.y };
    
    for (const [npcId, behavior] of this.behaviors) {
      behavior.update(time, delta, playerPos);
    }
  }

  /**
   * Update behavior config (called from Ink tag handlers)
   */
  setBehaviorState(npcId, property, value) {
    const behavior = this.behaviors.get(npcId);
    if (behavior) {
      behavior.setState(property, value);
    }
  }
}

/**
 * NPCBehavior - Individual NPC behavior instance
 */
class NPCBehavior {
  constructor(npcId, sprite, config, scene) {
    this.npcId = npcId;
    this.sprite = sprite;
    this.scene = scene;
    
    // Validate sprite reference
    if (!this.sprite || !this.sprite.body) {
      throw new Error(`❌ Invalid sprite provided for NPC ${npcId}`);
    }
    
    // Get NPC data and validate room ID
    const npcData = window.npcManager?.npcs?.get(npcId);
    if (!npcData || !npcData.roomId) {
      console.warn(`⚠️ NPC ${npcId} has no room assignment, using default`);
      this.roomId = 'unknown';
    } else {
      this.roomId = npcData.roomId;
    }
    
    // Verify sprite reference matches stored sprite
    if (npcData && npcData._sprite && npcData._sprite !== this.sprite) {
      console.warn(`⚠️ Sprite reference mismatch for ${npcId}`);
    }
    
    this.config = this.parseConfig(config);
    
    // State
    this.currentState = 'idle';
    this.direction = 'down';          // Current facing direction
    this.hostile = this.config.hostile.defaultState;
    this.influence = 0;
    
    // Patrol state
    this.patrolTarget = null;
    this.lastPatrolChange = 0;
    this.stuckTimer = 0;
    
    // Personal space state
    this.backingAway = false;
    
    // Animation tracking
    this.lastAnimationKey = null;
  }

  parseConfig(config) {
    // Parse and apply defaults to config
    const merged = {
      facePlayer: config.facePlayer !== undefined ? config.facePlayer : true,
      facePlayerDistance: config.facePlayerDistance || 96,
      patrol: {
        enabled: config.patrol?.enabled || false,
        speed: config.patrol?.speed || 100,
        changeDirectionInterval: config.patrol?.changeDirectionInterval || 3000,
        bounds: config.patrol?.bounds || null
      },
      personalSpace: {
        enabled: config.personalSpace?.enabled || false,
        distance: config.personalSpace?.distance || 48,
        backAwaySpeed: config.personalSpace?.backAwaySpeed || 30,
        backAwayDistance: config.personalSpace?.backAwayDistance || 5
      },
      hostile: {
        defaultState: config.hostile?.defaultState || false,
        influenceThreshold: config.hostile?.influenceThreshold || -50,
        chaseSpeed: config.hostile?.chaseSpeed || 200,
        fleeSpeed: config.hostile?.fleeSpeed || 180,
        aggroDistance: config.hostile?.aggroDistance || 160
      }
    };
    
    // Pre-calculate squared distances for performance
    merged.facePlayerDistanceSq = merged.facePlayerDistance ** 2;
    merged.personalSpace.distanceSq = merged.personalSpace.distance ** 2;
    merged.hostile.aggroDistanceSq = merged.hostile.aggroDistance ** 2;
    
    // Validate patrol bounds include starting position
    if (merged.patrol.enabled && merged.patrol.bounds) {
      const bounds = merged.patrol.bounds;
      const spriteX = this.sprite.x;
      const spriteY = this.sprite.y;
      
      const inBoundsX = spriteX >= bounds.x && spriteX <= (bounds.x + bounds.width);
      const inBoundsY = spriteY >= bounds.y && spriteY <= (bounds.y + bounds.height);
      
      if (!inBoundsX || !inBoundsY) {
        console.warn(`⚠️ NPC ${this.npcId} starting position (${spriteX}, ${spriteY}) is outside patrol bounds. Expanding bounds...`);
        
        // Auto-expand bounds to include starting position
        const newX = Math.min(bounds.x, spriteX);
        const newY = Math.min(bounds.y, spriteY);
        const newMaxX = Math.max(bounds.x + bounds.width, spriteX);
        const newMaxY = Math.max(bounds.y + bounds.height, spriteY);
        
        merged.patrol.bounds = {
          x: newX,
          y: newY,
          width: newMaxX - newX,
          height: newMaxY - newY
        };
        
        console.log(`✅ Patrol bounds expanded to include starting position`);
      }
    }
    
    return merged;
  }

  update(time, delta, playerPos) {
    try {
      // Main behavior update logic
      // 1. Calculate distances to player
      // 2. Determine highest priority state
      const state = this.determineState(playerPos);
      
      // 3. Execute state behavior
      this.executeState(state, time, delta, playerPos);
      
      // 4. Update animations (handled in state execution)
      
      // 5. CRITICAL: Update depth after any movement
      // This ensures correct Y-sorting with player and other NPCs
      this.updateDepth();
      
    } catch (error) {
      console.error(`❌ Behavior update error for ${this.npcId}:`, error);
    }
  }
  
  updateDepth() {
    if (!this.sprite || !this.sprite.body) return;
    
    // Calculate depth based on bottom Y position (same as player)
    const spriteBottomY = this.sprite.y + (this.sprite.displayHeight / 2);
    const depth = spriteBottomY + 0.5; // World Y + sprite layer offset
    
    // Always update depth - no caching
    // Depth determines Y-sorting, must update every frame for moving NPCs
    this.sprite.setDepth(depth);
  }

  facePlayer(playerPos) { /* ... */ }
  updatePatrol(time, delta) { /* ... */ }
  maintainPersonalSpace(playerPos, delta) { /* ... */ }
  updateHostileBehavior(playerPos, delta) { /* ... */ }
  
  setState(property, value) { /* ... */ }
  calculateDirection(dx, dy) { /* ... */ }
  playAnimation(state, direction) { /* ... */ }
}
```

### 2. Animation System

**⚠️ CRITICAL: Animations MUST be created in Phase 0 (before behavior implementation)**

Animations are created in `npc-sprites.js` during sprite setup (Phase 0 prerequisite).

**Walking animations** (5 directions + flipX):
- walk-right, walk-down, walk-up, walk-up-right, walk-down-right
- walk-left directions use walk-right with flipX = true

**Idle animations** (5 directions + flipX):
- idle-right, idle-down, idle-up, idle-up-right, idle-down-right
- idle-left directions use idle-right with flipX = true

**Frame Numbers** (hacker sprite):
```javascript
// Walk animations
'walk-right': frames [1, 2, 3, 4]
'walk-down': frames [6, 7, 8, 9]
'walk-up': frames [11, 12, 13, 14]
'walk-up-right': frames [16, 17, 18, 19]
'walk-down-right': frames [21, 22, 23, 24]

// Idle animations
'idle-right': frame 0
'idle-down': frame 5
'idle-up': frame 10
'idle-up-right': frame 15
'idle-down-right': frame 20
```

**Animation Playback** (in NPCBehavior):
```javascript
playAnimation(state, direction) {
  // Map left directions to right with flipX
  let animDirection = direction;
  let flipX = false;
  
  if (direction.includes('left')) {
    animDirection = direction.replace('left', 'right');
    flipX = true;
  }
  
  const animKey = `npc-${this.npcId}-${state}-${animDirection}`;
  
  // Only change animation if different
  if (this.lastAnimationKey !== animKey) {
    if (this.sprite.anims.exists(animKey)) {
      this.sprite.play(animKey, true);
      this.lastAnimationKey = animKey;
    } else {
      // Fallback: use idle animation if walk doesn't exist
      if (state === 'walk') {
        const idleKey = `npc-${this.npcId}-idle-${animDirection}`;
        if (this.sprite.anims.exists(idleKey)) {
          console.warn(`⚠️ Walk animation missing for ${this.npcId}-${animDirection}, using idle`);
          this.sprite.play(idleKey, true);
          this.lastAnimationKey = idleKey;
        }
      }
    }
  }
  
  // Set flipX for left-facing directions
  this.sprite.setFlipX(flipX);
}
```

### 3. Turn Towards Player

**Algorithm** (from player.js movement logic):

```javascript
facePlayer(playerPos) {
  if (!this.config.facePlayer || !playerPos) return;
  
  const dx = playerPos.x - this.sprite.x;
  const dy = playerPos.y - this.sprite.y;
  const distanceSq = dx * dx + dy * dy;
  
  // Only face player if within configured range
  if (distanceSq > this.config.facePlayerDistanceSq) {
    return;
  }
  
  // Calculate direction (8-way)
  const absVX = Math.abs(dx);
  const absVY = Math.abs(dy);
  
  if (absVX > absVY * 2) {
    // Mostly horizontal
    this.direction = dx > 0 ? 'right' : 'left';
  } else if (absVY > absVX * 2) {
    // Mostly vertical
    this.direction = dy > 0 ? 'down' : 'up';
  } else {
    // Diagonal
    if (dy > 0) {
      this.direction = dx > 0 ? 'down-right' : 'down-left';
    } else {
      this.direction = dx > 0 ? 'up-right' : 'up-left';
    }
  }
  
  // Play idle animation in that direction
  this.playAnimation('idle', this.direction);
  
  // Set flipX for left directions
  this.sprite.setFlipX(this.direction.includes('left'));
}
```

### 4. Patrol Behavior

**Algorithm** (similar to player keyboard movement):

```javascript
updatePatrol(time, delta) {
  if (!this.config.patrol.enabled) return;
  
  // Check if it's time to change direction
  if (time - this.lastPatrolChange > this.config.patrol.changeDirectionInterval) {
    this.chooseRandomPatrolDirection();
    this.lastPatrolChange = time;
  }
  
  // Move in current direction
  if (this.patrolTarget) {
    const dx = this.patrolTarget.x - this.sprite.x;
    const dy = this.patrolTarget.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Reached target or stuck
    if (distance < 8 || this.sprite.body.blocked.none === false) {
      this.stuckTimer += delta;
      
      // If stuck for > 500ms, choose new direction
      if (this.stuckTimer > 500) {
        this.chooseRandomPatrolDirection();
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
      
      // Apply velocity
      const velocityX = (dx / distance) * this.config.patrol.speed;
      const velocityY = (dy / distance) * this.config.patrol.speed;
      this.sprite.body.setVelocity(velocityX, velocityY);
      
      // Update direction and animation
      this.updateDirectionFromVelocity(velocityX, velocityY);
      this.playAnimation('walk', this.direction);
    }
  }
}

chooseRandomPatrolDirection() {
  // Get NPC's room data (roomId stored in constructor)
  const npcData = window.npcManager.npcs.get(this.npcId);
  const roomData = window.rooms[this.roomId];
  
  if (!roomData) {
    console.warn(`⚠️ Room ${this.roomId} not found for ${this.npcId} patrol`);
    return;
  }
  
  const bounds = this.config.patrol.bounds;
  const roomX = roomData.worldX || 0;
  const roomY = roomData.worldY || 0;
  
  // Pick a random point within patrol bounds
  this.patrolTarget = {
    x: roomX + bounds.x + Math.random() * bounds.width,
    y: roomY + bounds.y + Math.random() * bounds.height
  };
  
  console.log(`🚶 ${this.npcId} patrol target: (${this.patrolTarget.x}, ${this.patrolTarget.y})`);
}
```

### 5. Personal Space Behavior

**Algorithm**:

```javascript
maintainPersonalSpace(playerPos, delta) {
  if (!this.config.personalSpace.enabled || !playerPos) return false;
  
  const dx = this.sprite.x - playerPos.x;  // Away from player
  const dy = this.sprite.y - playerPos.y;
  const distanceSq = dx * dx + dy * dy;
  
  // If player too close, back away slowly
  if (distanceSq < this.config.personalSpace.distanceSq) {
    const distance = Math.sqrt(distanceSq);
    
    // Back away in small increments (5px at a time) to stay within interaction range
    const backAwayDist = this.config.personalSpace.backAwayDistance;
    const backX = (dx / distance) * backAwayDist;
    const backY = (dy / distance) * backAwayDist;
    
    // Try to move back (Phaser collision will prevent if blocked by walls)
    const oldX = this.sprite.x;
    const oldY = this.sprite.y;
    this.sprite.setPosition(this.sprite.x + backX, this.sprite.y + backY);
    
    // If position didn't change, we're blocked by a wall
    if (this.sprite.x === oldX && this.sprite.y === oldY) {
      // Can't back away - just face player
      this.facePlayer(playerPos);
      return true; // Still in personal space violation
    }
    
    // Successfully backed away - face player while backing
    this.direction = this.calculateDirection(-dx, -dy);  // Negative = face player
    this.playAnimation('idle', this.direction);  // Use idle, not walk
    
    this.isMoving = false;  // Not "walking", just adjusting position
    this.backingAway = true;
    
    return true; // Personal space behavior active
  }
  
  this.backingAway = false;
  return false; // No personal space violation
}
```

**Design Notes**:
- Distance: 48px (1.5 tiles) - **smaller than interaction range (64px)**
- Speed: 30 px/s - slow, subtle backing
- Increment: 5px - small adjustments to stay within interaction range
- Animation: Use 'idle' animation while backing (face player, maintain eye contact)
- **NPC backs away but remains interactive**

### 6. Hostile Behavior

**Visual Feedback**:

```javascript
setHostile(hostile) {
  if (this.hostile === hostile) return; // No change
  
  this.hostile = hostile;
  
  // Emit event for other systems to react
  if (window.eventDispatcher) {
    window.eventDispatcher.emit('npc_hostile_changed', {
      npcId: this.npcId,
      hostile: hostile
    });
  }
  
  if (hostile) {
    // Red tint (0xff0000 with 50% strength)
    this.sprite.setTint(0xff6666);
    console.log(`🔴 ${this.npcId} is now hostile`);
  } else {
    // Clear tint
    this.sprite.clearTint();
    console.log(`✅ ${this.npcId} is no longer hostile`);
  }
}
```

**Future Chase/Flee** (stub for now):

```javascript
updateHostileBehavior(playerPos, delta) {
  if (!this.hostile || !playerPos) return false;
  
  const dx = playerPos.x - this.sprite.x;
  const dy = playerPos.y - this.sprite.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // TODO: Implement chase/flee based on influence and distance
  // For now, just apply hostile tint
  console.log(`[${this.npcId}] Hostile mode active (influence: ${this.influence})`);
  
  return false; // Not actively chasing/fleeing yet
}
```

---

## Integration Points

### 1. game.js Update Loop

Add behavior update to main game loop:

```javascript
// In js/core/game.js update() function

export function update(time, delta) {
  if (!player) return;
  
  // Existing updates...
  updatePlayerMovement();
  updatePlayerRoom();
  
  // NEW: Update NPC behaviors
  if (window.npcBehaviorManager) {
    window.npcBehaviorManager.update(time, delta);
  }
  
  // Existing updates...
}
```

### 2. game.js Create Phase

Initialize behavior manager (but DO NOT register behaviors here):

```javascript
// In js/core/game.js create() function

export function create() {
  // Existing initialization...
  initializeRooms(this);
  createPlayer(this);
  
  // NEW: Initialize behavior manager (async lazy loading - compatible with room loading pattern)
  if (window.npcManager) {
    import('./systems/npc-behavior.js?v=1')
      .then(module => {
        window.npcBehaviorManager = new module.NPCBehaviorManager(this, window.npcManager);
        console.log('✅ NPC Behavior Manager initialized');
        // NOTE: Individual behaviors registered per-room in rooms.js createNPCSpritesForRoom()
      })
      .catch(error => {
        console.error('❌ Failed to initialize NPC Behavior Manager:', error);
      });
  }
}
```

**Important**: Behaviors are registered **per-room** as sprites are created, not globally here.

### 3. rooms.js Integration

Register behaviors when NPC sprites are created:

```javascript
// In js/core/rooms.js createNPCSpritesForRoom() function
// Add after sprite creation and collision setup

function createNPCSpritesForRoom(roomId, roomData) {
  // ... existing sprite creation code ...
  
  for (const npc of npcsInRoom) {
    // Only create sprites for NPCs with physical presence
    if (npc.npcType === 'person' || npc.npcType === 'both') {
      try {
        const sprite = NPCSpriteManager.createNPCSprite(gameRef, npc, roomData);
        
        if (sprite) {
          roomData.npcSprites.push(sprite);
          
          // Existing collision setup...
          if (window.player) {
            NPCSpriteManager.createNPCCollision(gameRef, sprite, window.player);
          }
          NPCSpriteManager.setupNPCEnvironmentCollisions(gameRef, sprite, roomId);
          
          // NEW: Register behavior if configured
          // Only for sprite-based NPCs (not phone-only)
          if (window.npcBehaviorManager && npc.behavior) {
            window.npcBehaviorManager.registerBehavior(
              npc.id,
              sprite,
              npc.behavior
            );
            console.log(`🤖 Behavior registered for ${npc.id}`);
          }
          
          console.log(`✅ NPC sprite created: ${npc.id} in room ${roomId}`);
        }
      } catch (error) {
        console.error(`❌ Error creating NPC sprite for ${npc.id}:`, error);
      }
    } else if (npc.behavior) {
      // Warn if phone-only NPC has behavior config (will be ignored)
      console.warn(`⚠️ Behavior config ignored for phone-only NPC ${npc.id}`);
    }
  }
}
```

**Note**: No unregister function needed - rooms never unload, sprites persist throughout game.

### 4. Scenario Initialization - Add RoomId to NPCs

Ensure NPCs have roomId property:

```javascript
// In js/core/rooms.js initializeRooms() or similar
// Add when processing scenario JSON

for (const [roomId, roomData] of Object.entries(gameScenario.rooms)) {
  if (roomData.npcs && Array.isArray(roomData.npcs)) {
    for (const npc of roomData.npcs) {
      // Store roomId in NPC data for behavior system
      npc.roomId = roomId;
      
      // Register NPC with manager
      if (window.npcManager) {
        window.npcManager.registerNPC(npc);
      }
    }
  }
}
```

### 5. npc-game-bridge.js Extensions

Add behavior control methods:

```javascript
// In js/systems/npc-game-bridge.js

class NPCGameBridge {
  // ... existing methods ...
  
  /**
   * Set NPC hostile state
   * @param {string} npcId - NPC identifier
   * @param {boolean} hostile - Hostile state
   */
  setNPCHostile(npcId, hostile) {
    if (window.npcBehaviorManager) {
      window.npcBehaviorManager.setBehaviorState(npcId, 'hostile', hostile);
      console.log(`🔴 NPC ${npcId} hostile: ${hostile}`);
    }
  }
  
  /**
   * Set NPC influence score
   * @param {string} npcId - NPC identifier
   * @param {number} influence - Influence value
   */
  setNPCInfluence(npcId, influence) {
    if (window.npcBehaviorManager) {
      window.npcBehaviorManager.setBehaviorState(npcId, 'influence', influence);
      console.log(`💯 NPC ${npcId} influence: ${influence}`);
    }
  }
  
  /**
   * Toggle NPC patrol mode
   * @param {string} npcId - NPC identifier
   * @param {boolean} enabled - Patrol enabled
   */
  setNPCPatrol(npcId, enabled) {
    if (window.npcBehaviorManager) {
      window.npcBehaviorManager.setBehaviorState(npcId, 'patrol', enabled);
      console.log(`🚶 NPC ${npcId} patrol: ${enabled}`);
    }
  }
}
```

### 6. Ink Tag Processing

Extend tag handling in conversation manager to call bridge methods:

```javascript
// In person-chat or phone-chat minigame tag processing

function processInkTags(tags, npcId) {
  for (const tag of tags) {
    if (tag === 'hostile' || tag === 'hostile:true') {
      window.npcGameBridge.setNPCHostile(npcId, true);
    } else if (tag === 'hostile:false') {
      window.npcGameBridge.setNPCHostile(npcId, false);
    } else if (tag.startsWith('influence:')) {
      const value = parseInt(tag.split(':')[1]);
      window.npcGameBridge.setNPCInfluence(npcId, value);
    } else if (tag === 'patrol_mode:on') {
      window.npcGameBridge.setNPCPatrol(npcId, true);
    } else if (tag === 'patrol_mode:off') {
      window.npcGameBridge.setNPCPatrol(npcId, false);
    } else if (tag.startsWith('personal_space:')) {
      const distance = parseInt(tag.split(':')[1]);
      window.npcGameBridge.setNPCPersonalSpace(npcId, distance);
    }
  }
}
```

---

## Phased Implementation

### Phase -1: Critical Prerequisites (Must Complete First)
**Priority**: CRITICAL  
**Estimated Time**: 1 day

- [ ] **Add walk animations to npc-sprites.js**
  - Walk animations for 4 directions (up, down, left, right)
  - Currently only idle animations exist
  - See animation frame reference below
- [ ] **Verify player position access**
  - Ensure `window.player.x/y` accessible in update loop
  - Add defensive null checks
- [ ] **Add phone NPC filtering**
  - Check NPC type before behavior registration
  - Prevent behavior registration for phone-only NPCs
- [ ] **Implement setupNPCEnvironmentCollisions**
  - Add function to npc-sprites.js if missing
  - Set up wall and furniture collisions for NPCs

**Animation Frame Reference**:
```javascript
// Walk animations (4 directions)
const walkAnimations = {
  'walk-down': [6, 7, 8, 9],
  'walk-up': [11, 12, 13, 14],
  'walk-left': [1, 2, 3, 4],  // with flipX
  'walk-right': [1, 2, 3, 4]
};

// Idle animations (4 directions)
const idleAnimations = {
  'idle-down': 5,
  'idle-up': 10,
  'idle-left': 0,  // with flipX
  'idle-right': 0
};
```

---

### Phase 0: Foundation Setup
**Priority**: HIGH  
**Estimated Time**: 1 day

- [ ] **Verify animations work** - Test walk animations created in Phase -1
- [ ] **Add roomId to NPC data** - Store during scenario initialization
  - Used by patrol bounds calculation
- [ ] **Set up test scenario** - Use example_scenario.json for testing
- [ ] **Verify integration points** - Confirm behavior registration works

**Animation Frame Reference** (for npc-sprites.js):
```javascript
// Walk animations (hacker sprite)
const walkAnimations = [
  { dir: 'walk-right', frames: [1, 2, 3, 4] },
  { dir: 'walk-down', frames: [6, 7, 8, 9] },
  { dir: 'walk-up', frames: [11, 12, 13, 14] },
  { dir: 'walk-up-right', frames: [16, 17, 18, 19] },
  { dir: 'walk-down-right', frames: [21, 22, 23, 24] }
];

// Idle animations (hacker sprite)
const idleAnimations = [
  { dir: 'idle-right', frame: 0 },
  { dir: 'idle-down', frame: 5 },
  { dir: 'idle-up', frame: 10 },
  { dir: 'idle-up-right', frame: 15 },
  { dir: 'idle-down-right', frame: 20 }
];
```

### Phase 1: Core Infrastructure (Priority: HIGH)
- [ ] Create `npc-behavior.js` with basic structure
- [ ] Implement `NPCBehaviorManager` class
- [ ] Implement `NPCBehavior` class with state machine skeleton
- [ ] Add sprite validation in constructor
- [ ] Add player position null checks in update loop
- [ ] Integrate with `game.js` update loop
- [ ] Integrate registration in `rooms.js` createNPCSpritesForRoom()
- [ ] Test with single NPC (idle state only)

### Phase 2: Face Player (Priority: HIGH)
- [ ] Implement `facePlayer()` logic
- [ ] Add direction calculation (8-way)
- [ ] Test with multiple NPCs at different positions
- [ ] Verify idle animation transitions

### Phase 3: Patrol Behavior (Priority: MEDIUM)
- [ ] Implement `updatePatrol()` logic
- [ ] Add patrol bounds validation in parseConfig()
- [ ] Add random direction selection
- [ ] Implement stuck detection and recovery
- [ ] Add collision handling
- [ ] Test with patrol bounds
- [ ] Add scenario JSON patrol configuration

### Phase 4: Personal Space (Priority: LOW)
- [ ] Implement `maintainPersonalSpace()` logic
- [ ] Add collision detection for backing away
- [ ] Add backing-away movement
- [ ] Test with varying distances
- [ ] Test backing into walls
- [ ] Add scenario JSON personal space configuration

### Phase 5: Ink Integration (Priority: MEDIUM)
- [ ] Extend `npc-game-bridge.js` with behavior methods
- [ ] Implement tag handlers for hostile, influence, patrol
- [ ] Add tag processing to person-chat minigame
- [ ] Create test Ink story with behavior tags
- [ ] Test tag → behavior state transitions

### Phase 6: Hostile Behavior (Priority: LOW)
- [ ] Implement hostile visual feedback (red tint)
- [ ] Add influence → hostility logic
- [ ] Add event emission for hostile state changes
- [ ] Stub chase/flee behaviors
- [ ] Test hostile state changes via Ink tags

### Phase 7: Polish & Debug (Priority: HIGH)
- [ ] Add animation fallback strategy
- [ ] Add debug visualization mode (optional)
- [ ] Performance testing with 10+ NPCs
- [ ] Update user documentation

### Phase 8: Documentation & Testing (Priority: HIGH)
- [ ] Write user documentation for scenario JSON config
- [ ] Write developer documentation for extending behaviors
- [ ] Update QUICK_REFERENCE.md with troubleshooting
- [ ] Create comprehensive test scenario
- [ ] Final integration testing

---

## Testing Strategy

### Unit Tests
1. **Direction calculation**: Test 8-way direction from dx/dy
2. **Distance checks**: Verify range calculations
3. **State priority**: Ensure higher priority states override lower
4. **Config parsing**: Test default values and overrides

### Integration Tests
1. **Face player**: NPC turns when player approaches
2. **Patrol**: NPC moves randomly and handles collisions
3. **Personal space**: NPC backs away when player too close
4. **Ink tags**: Behavior changes when tags processed
5. **Multiple NPCs**: All NPCs update independently

### Performance Tests
1. **10 NPCs**: All idle, measure FPS impact
2. **10 NPCs**: All patrolling, measure FPS impact
3. **Update throttling**: Verify 50ms update interval

### Test Scenario

Create `scenarios/behavior-test.json` with:
- 1 NPC with face_player only (default)
- 1 NPC with patrol behavior
- 1 NPC with personal space behavior
- 1 NPC that starts hostile
- 1 NPC with Ink story that triggers hostile via tag

---

## Future Enhancements

### Short-term (Post-MVP)
- [ ] Chase/flee behavior implementation (hostile movement)
- [ ] Waypoint-based patrol paths (not just random)
- [ ] Group behaviors (NPCs follow each other)
- [ ] Conversation bubbles during face_player

### Long-term
- [ ] NPC pathfinding (use EasyStar like player)
- [ ] NPC-to-NPC interactions
- [ ] Emotion system (beyond just hostile)
- [ ] Animation state blending (smooth transitions)
- [ ] Dynamic behavior scheduling (time-based state changes)

---

## Performance Considerations

1. **Update throttling**: Behaviors update every 50ms, not every frame (16ms)
2. **Distance caching**: Pre-calculate squared distances to avoid sqrt() when possible
3. **Animation checks**: Only change animation if state/direction changed
4. **Spatial partitioning**: Future enhancement if >20 NPCs in single room
5. **Behavior disable**: NPCs in non-visible rooms don't update (future)

---

## Code Style & Conventions

1. **Match player.js patterns**: Reuse direction calculation, animation logic
2. **Depth calculation**: Use same formula as player (bottomY + 0.5)
3. **Collision handling**: Use Phaser arcade physics like player
4. **Console logging**: Use emoji prefixes (🤖 for behaviors)
5. **Config defaults**: Always provide sensible defaults
6. **Error handling**: Graceful degradation if behavior config invalid

---

## Dependencies

### Existing Systems
- `npc-manager.js` - NPC data, Ink integration
- `npc-sprites.js` - Sprite creation, animations
- `player.js` - Movement/animation patterns to reuse
- `game.js` - Update loop integration
- `constants.js` - TILE_SIZE, INTERACTION_RANGE

### New Files
- `npc-behavior.js` - Core behavior system
- `behavior-test.json` - Test scenario

### Modified Files
- `game.js` - Add behavior update call
- `npc-game-bridge.js` - Add behavior control methods
- `person-chat-minigame.js` - Add tag processing for behavior
- `npc-sprites.js` - Add walk animation creation

---

## Risk Assessment

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| Missing walk animations | CRITICAL | Create in Phase -1 | Required |
| Phone NPC type filtering | HIGH | Add type check in Phase -1 | Required |
| Missing player position null check | HIGH | Add in update loop | Required |
| Performance with many NPCs | MEDIUM | Throttle updates, profile | Planned |
| Patrol bounds exclude start position | MEDIUM | Auto-expand bounds | Planned |
| Personal space backs into walls | MEDIUM | Add collision detection | Planned |
| Animation conflicts | LOW | Careful testing | Planned |
| Ink tag conflicts | LOW | Use namespaced tags | OK |
| Config schema complexity | LOW | Clear examples, good defaults | OK |

---

## Success Criteria

✅ **Phase -1 Complete**: Walk animations created, prerequisites met  
✅ **Phase 1 Complete**: Single NPC faces player when approached
✅ **Phase 2 Complete**: NPC patrols randomly and handles collisions
✅ **Phase 3 Complete**: NPC maintains personal space from player
✅ **Phase 4 Complete**: Ink tags change NPC behavior in real-time
✅ **Phase 5 Complete**: Hostile NPC displays red tint
✅ **MVP Complete**: All behaviors work in test scenario without errors
✅ **Production Ready**: Documentation complete, performance verified

---

## References

- `js/core/player.js` - Movement, animation, depth calculation
- `js/systems/npc-sprites.js` - Sprite creation, current animation setup
- `js/systems/npc-manager.js` - NPC data management, Ink integration
- `docs/INK_BEST_PRACTICES.md` - Ink tag system usage
- `.github/copilot-instructions.md` - Project architecture, patterns

---

## Important Notes

### NPC Collision Body Configuration

**NPCs intentionally use DIFFERENT collision settings than player:**

```javascript
// NPC collision (npc-sprites.js) - CORRECT, DO NOT CHANGE
sprite.body.setSize(18, 10);   // Wider for better hit detection
sprite.body.setOffset(23, 50); // Adjusted for wider box
sprite.body.immovable = true;  // Can't be pushed (same as player)

// Player collision (player.js) - Different by design
player.body.setSize(15, 10);   // Narrower for tighter control
player.body.setOffset(25, 50); // Different offset
player.body.immovable = true;  // Can't be pushed (same as NPCs)
```

**Why NPCs are wider:**
- Better hit detection during patrol (moving NPCs need larger collision)
- Prevents player from easily slipping past patrolling guards
- Both use `immovable: true` (correct for both player and NPCs)
- Both are 10px tall and positioned at sprite feet

**About `immovable: true`:**
- Means sprite cannot be *pushed* by other sprites
- Does NOT prevent sprite from moving itself via velocity or position
- Same physics setting used by player
- Allows collision detection while maintaining control

**Do not "match player collision"** - the width difference is intentional.

### Room Loading and NPC Lifecycle

**CRITICAL UNDERSTANDING**: Rooms are **never unloaded** in Break Escape.

**How it works:**
1. Rooms load once when player first enters them
2. Rooms stay loaded for entire game session
3. All NPCs persist throughout the game
4. `unloadNPCSprites()` function exists but is never called

**Implications for behavior system:**
- ✅ **No lifecycle management needed** - sprites never destroyed
- ✅ **No unregister function needed** - behaviors persist naturally
- ✅ **No state persistence needed** - NPCs maintain state automatically
- ✅ **Simpler implementation** - no cleanup logic required

**Code pattern:**
```javascript
// Behavior registration (once per NPC, persists forever)
window.npcBehaviorManager.registerBehavior(npcId, sprite, config);

// No corresponding unregister needed - sprite lives for entire game
```

**Why this matters:**
- Dramatically simplifies implementation (no room transition handling)
- Reduces bugs (no stale sprite references possible)
- Better performance (no destroy/recreate overhead)
- Natural state persistence (behaviors never reset)

See `review/COMPREHENSIVE_PLAN_REVIEW.md` section "CRITICAL #7" for full analysis.

---

### Personal Space Design Decision

Personal space default is **48px (1.5 tiles)**, which is **smaller than interaction range (64px / 2 tiles)**.

This means:
- Player can still interact with backing-away NPC
- NPC remains conversational while maintaining comfort distance
- More natural UX than breaking interaction entirely

This is **intentional design** for MVP. Future enhancement could add `breakInteraction` flag.

---

## Questions for Review

1. Should hostile chase/flee be part of MVP or post-MVP?
   - **Recommendation**: Post-MVP (stub only for now) ✅ **CONFIRMED**

2. Should personal space back-away use pathfinding or direct movement?
   - **Recommendation**: Direct movement (simpler, sufficient for MVP) ✅ **CONFIRMED**

3. Should behaviors be per-room or global?
   - **Recommendation**: Global (NPCs in non-visible rooms just don't update) ✅ **CONFIRMED**

4. Should we add behavior debug visualization (show ranges, paths)?
   - **Recommendation**: Yes, add debug mode toggle (Phase 7) ✅ **CONFIRMED**

5. Integration with existing NPC talk icons system?
   - **Recommendation**: Keep separate, talk icons are UI layer ✅ **CONFIRMED**

---

**Document Status**: Implementation Ready v3.0  
**Last Updated**: November 9, 2025  
**Estimated Timeline**: 3 weeks (Phase -1: 1 day, Phase 0-7: 2.5 weeks)  
**Author**: Development Team
