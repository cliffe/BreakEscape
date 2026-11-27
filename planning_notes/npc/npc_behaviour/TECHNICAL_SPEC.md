# NPC Behavior Technical Specification

## Module Architecture

### File Structure

```
js/systems/
├── npc-behavior.js          (NEW - 400-500 lines)
│   ├── NPCBehaviorManager   (main manager class)
│   └── NPCBehavior          (individual behavior instance)
│
├── npc-game-bridge.js       (MODIFIED - add 5 methods)
│   ├── setNPCHostile()
│   ├── setNPCInfluence()
│   ├── setNPCPatrol()
│   ├── setNPCPersonalSpace()
│   └── _updateNPCBehaviorFromInfluence()
│
└── npc-sprites.js           (MODIFIED - add walk animations)
    └── setupNPCAnimations() (extend to create walk anims)

js/core/
└── game.js                  (MODIFIED - 2 integration points)
    ├── create()             (initialize behavior manager)
    └── update()             (call behavior update loop)

js/minigames/person-chat/
└── person-chat-minigame.js  (MODIFIED - tag processing)
    └── processInkTags()     (add behavior tag handlers)
```

---

## Class Definitions

### NPCBehaviorManager

**Purpose**: Singleton manager for all NPC behaviors. Initialized once in game.js.

**Properties**:
```javascript
{
  scene: Phaser.Scene           // Game scene reference
  npcManager: NPCManager        // NPC Manager reference
  behaviors: Map<string, NPCBehavior>  // npcId → behavior instance
  updateInterval: number        // Update throttle (50ms)
  lastUpdate: number           // Last update timestamp
}
```

**Methods**:

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `constructor(scene, npcManager)` | scene, npcManager | void | Initialize manager |
| `registerBehavior(npcId, sprite, config)` | npcId, sprite, config | void | Create behavior for NPC |
| `update(time, delta)` | time, delta | void | Update all behaviors (throttled) |
| `setBehaviorState(npcId, property, value)` | npcId, property, value | void | Update behavior property |
| `getBehavior(npcId)` | npcId | NPCBehavior\|null | Get behavior instance |
| `removeBehavior(npcId)` | npcId | void | Remove behavior (optional - for future) |

**Lifecycle**:
```
Create Phase (game.js):
  new NPCBehaviorManager(scene, npcManager)
  ↓
  registerBehavior(npcId, sprite, config) for each NPC
  ↓
Update Phase (game.js):
  update(time, delta) every frame
  ↓
  (throttled to 50ms intervals)
  ↓
  NPCBehavior.update() for each behavior
```

---

### NPCBehavior

**Purpose**: Individual behavior state machine for one NPC.

**Properties**:
```javascript
{
  // Identity
  npcId: string                // NPC identifier
  sprite: Phaser.Sprite        // Sprite reference
  scene: Phaser.Scene          // Scene reference
  roomId: string               // Room identifier (from npcData)
  
  // Configuration
  config: {
    facePlayer: boolean
    facePlayerDistance: number
    facePlayerDistanceSq: number  // Cached squared distance
    patrol: {
      enabled: boolean
      speed: number
      changeDirectionInterval: number
      bounds: { x, y, width, height }
    }
    personalSpace: {
      enabled: boolean
      distance: number
      distanceSq: number         // Cached squared distance
      backAwaySpeed: number
    }
    hostile: {
      defaultState: boolean
      influenceThreshold: number
      chaseSpeed: number
      fleeSpeed: number
      aggroDistance: number
      aggroDistanceSq: number    // Cached squared distance
    }
  }
  
  // Runtime state
  currentState: string          // 'idle', 'face_player', 'patrol', etc.
  direction: string             // 'down', 'up', 'left', 'right', etc.
  hostile: boolean              // Current hostile state
  influence: number             // Current influence score
  
  // Patrol state
  patrolTarget: {x, y}|null    // Current patrol destination
  lastPatrolChange: number     // Timestamp of last direction change
  stuckTimer: number           // How long NPC has been stuck
  lastPosition: {x, y}         // For stuck detection
  
  // Personal space state
  backingAway: boolean         // Currently backing away
  
  // Animation state
  lastAnimationKey: string     // Track animation changes
  isMoving: boolean            // Movement state
}
```

**Methods**:

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `constructor(npcId, sprite, config, scene)` | npcId, sprite, config, scene | void | Initialize behavior |
| `update(time, delta, playerPos)` | time, delta, playerPos | void | Main update loop |
| `parseConfig(config)` | config | Object | Parse and validate config |
| `determineState(playerPos)` | playerPos | string | Calculate highest priority state |
| `executeState(state, time, delta, playerPos)` | state, time, delta, playerPos | void | Execute behavior for state |
| `facePlayer(playerPos)` | playerPos | void | Face towards player |
| `updatePatrol(time, delta)` | time, delta | void | Patrol behavior |
| `maintainPersonalSpace(playerPos, delta)` | playerPos, delta | boolean | Personal space behavior |
| `updateHostileBehavior(playerPos, delta)` | playerPos, delta | boolean | Hostile behavior |
| `chooseRandomPatrolDirection()` | none | void | Pick random patrol target |
| `calculateDirection(dx, dy)` | dx, dy | string | Calculate 8-way direction |
| `updateDirectionFromVelocity(vx, vy)` | vx, vy | void | Update direction from velocity |
| `playAnimation(state, direction)` | state, direction | void | Play animation (idle/walk) |
| `updateDepth()` | none | void | Update sprite depth |
| `setState(property, value)` | property, value | void | Update state property |
| `setHostile(hostile)` | hostile | void | Set hostile state with tint |
| `setInfluence(influence)` | influence | void | Set influence score |

**State Machine**:

```
determineState(playerPos) {
  1. Check hostile behavior (highest priority)
     → If hostile + close: 'chase' or 'flee'
  
  2. Check personal space
     → If player too close: 'maintain_space'
  
  3. Check patrol
     → If patrol enabled: 'patrol'
  
  4. Check face player
     → If player in range: 'face_player'
  
  5. Default: 'idle'
}

executeState(state) {
  switch (state) {
    case 'idle':
      sprite.body.setVelocity(0, 0)
      playAnimation('idle', direction)
      
    case 'face_player':
      facePlayer(playerPos)
      sprite.body.setVelocity(0, 0)
      
    case 'patrol':
      updatePatrol(time, delta)
      
    case 'maintain_space':
      maintainPersonalSpace(playerPos, delta)
      
    case 'chase':
      updateHostileBehavior(playerPos, delta)  // Stub for now
      
    case 'flee':
      updateHostileBehavior(playerPos, delta)  // Stub for now
  }
}
```

---

## Configuration Schema

### Default Configuration

```javascript
const DEFAULT_CONFIG = {
  facePlayer: true,
  facePlayerDistance: 96,      // 3 tiles
  facePlayerDistanceSq: 9216,  // Pre-calculated
  
  patrol: {
    enabled: false,
    speed: 100,                // px/s (player is 150)
    changeDirectionInterval: 3000,  // ms
    bounds: {
      x: 0,
      y: 0,
      width: 320,              // Full room width
      height: 288              // Full room height
    }
  },
  
  personalSpace: {
    enabled: false,
    distance: 48,              // 1.5 tiles (smaller than interaction range)
    distanceSq: 2304,          // Pre-calculated
    backAwaySpeed: 30,         // px/s (slow backing)
    backAwayDistance: 5        // Only move 5px at a time
  },
  
  hostile: {
    defaultState: false,
    influenceThreshold: -50,
    chaseSpeed: 200,           // px/s
    fleeSpeed: 180,            // px/s
    aggroDistance: 160,        // 5 tiles
    aggroDistanceSq: 25600     // Pre-calculated
  }
};
```

### Config Merging

```javascript
parseConfig(userConfig) {
  const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));  // Deep clone
  
  if (userConfig.facePlayer !== undefined) {
    config.facePlayer = userConfig.facePlayer;
  }
  
  if (userConfig.facePlayerDistance) {
    config.facePlayerDistance = userConfig.facePlayerDistance;
    config.facePlayerDistanceSq = config.facePlayerDistance ** 2;
  }
  
  // Merge patrol config
  if (userConfig.patrol) {
    Object.assign(config.patrol, userConfig.patrol);
  }
  
  // Calculate patrol bounds relative to NPC's room
  // (done in constructor after room data available)
  
  // Merge personal space config
  if (userConfig.personalSpace) {
    Object.assign(config.personalSpace, userConfig.personalSpace);
    if (userConfig.personalSpace.distance) {
      config.personalSpace.distanceSq = config.personalSpace.distance ** 2;
    }
  }
  
  // Merge hostile config
  if (userConfig.hostile) {
    Object.assign(config.hostile, userConfig.hostile);
    if (userConfig.hostile.aggroDistance) {
      config.hostile.aggroDistanceSq = config.hostile.aggroDistance ** 2;
    }
  }
  
  return config;
}
```

---

## Animation System

### Animation Key Format

Pattern: `npc-{npcId}-{state}-{direction}`

Examples:
- `npc-guard-idle-down`
- `npc-guard-walk-right`
- `npc-receptionist-walk-up-left`

### Animation Creation (in npc-sprites.js)

```javascript
export function setupNPCAnimations(scene, sprite, spriteSheet, config, npcId) {
  // Create idle animations (existing code)
  // ...
  
  // NEW: Create walk animations (8 directions)
  const walkAnimations = [
    { key: 'walk-right', frames: [1, 2, 3, 4] },
    { key: 'walk-down', frames: [6, 7, 8, 9] },
    { key: 'walk-up', frames: [11, 12, 13, 14] },
    { key: 'walk-up-right', frames: [16, 17, 18, 19] },
    { key: 'walk-down-right', frames: [21, 22, 23, 24] }
  ];
  
  walkAnimations.forEach(anim => {
    const animKey = `npc-${npcId}-${anim.key}`;
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(spriteSheet, {
          frames: anim.frames
        }),
        frameRate: 8,
        repeat: -1
      });
    }
  });
  
  // Left directions use right animations with flipX
  // (handled in NPCBehavior.playAnimation())
}
```

### Animation Playback Logic

```javascript
// In NPCBehavior class

playAnimation(state, direction) {
  // Map left directions to right
  let animDirection = direction;
  let flipX = false;
  
  if (direction.includes('left')) {
    animDirection = direction.replace('left', 'right');
    flipX = true;
  }
  
  const animKey = `npc-${this.npcId}-${state}-${animDirection}`;
  
  // Only change animation if different from current
  if (this.lastAnimationKey !== animKey) {
    if (this.sprite.anims.exists(animKey)) {
      this.sprite.play(animKey, true);
      this.lastAnimationKey = animKey;
    } else {
      console.warn(`Animation not found: ${animKey}`);
    }
  }
  
  // Set flipX for left-facing directions
  this.sprite.setFlipX(flipX);
}
```

---

## Movement Algorithms

### Direction Calculation (8-way)

```javascript
calculateDirection(dx, dy) {
  const absVX = Math.abs(dx);
  const absVY = Math.abs(dy);
  
  // Threshold: if one axis is > 2x the other, consider it pure cardinal
  if (absVX > absVY * 2) {
    return dx > 0 ? 'right' : 'left';
  }
  
  if (absVY > absVX * 2) {
    return dy > 0 ? 'down' : 'up';
  }
  
  // Diagonal
  if (dy > 0) {
    return dx > 0 ? 'down-right' : 'down-left';
  } else {
    return dx > 0 ? 'up-right' : 'up-left';
  }
}
```

### Face Player Algorithm

```javascript
facePlayer(playerPos) {
  if (!this.config.facePlayer || !playerPos) return;
  
  const dx = playerPos.x - this.sprite.x;
  const dy = playerPos.y - this.sprite.y;
  const distanceSq = dx * dx + dy * dy;
  
  // Only face if within range
  if (distanceSq > this.config.facePlayerDistanceSq) {
    return;
  }
  
  // Calculate direction
  this.direction = this.calculateDirection(dx, dy);
  
  // Play idle animation facing player
  this.playAnimation('idle', this.direction);
  
  // Stop movement
  if (this.sprite.body) {
    this.sprite.body.setVelocity(0, 0);
  }
}
```

### Patrol Algorithm

```javascript
updatePatrol(time, delta) {
  if (!this.config.patrol.enabled) return;
  
  // Time to change direction?
  if (!this.patrolTarget || 
      time - this.lastPatrolChange > this.config.patrol.changeDirectionInterval) {
    this.chooseRandomPatrolDirection();
    this.lastPatrolChange = time;
    this.stuckTimer = 0;
  }
  
  // Calculate vector to target
  const dx = this.patrolTarget.x - this.sprite.x;
  const dy = this.patrolTarget.y - this.sprite.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Reached target?
  if (distance < 8) {
    this.chooseRandomPatrolDirection();
    return;
  }
  
  // Check if stuck (blocked by collision)
  const isBlocked = this.sprite.body.blocked.none === false;
  
  if (isBlocked) {
    this.stuckTimer += delta;
    
    // Stuck for > 500ms? Choose new direction
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
    this.direction = this.calculateDirection(dx, dy);
    this.playAnimation('walk', this.direction);
    this.isMoving = true;
  }
}

chooseRandomPatrolDirection() {
  // Get NPC's room data
  const npcData = window.npcManager.npcs.get(this.npcId);
  const roomData = window.rooms[npcData.roomId];
  
  if (!roomData) {
    console.warn(`Room data not found for NPC ${this.npcId}`);
    return;
  }
  
  const bounds = this.config.patrol.bounds;
  const roomX = roomData.worldX || 0;
  const roomY = roomData.worldY || 0;
  
  // Pick random point within bounds
  this.patrolTarget = {
    x: roomX + bounds.x + Math.random() * bounds.width,
    y: roomY + bounds.y + Math.random() * bounds.height
  };
  
  console.log(`🚶 ${this.npcId} patrol target: (${this.patrolTarget.x}, ${this.patrolTarget.y})`);
}
```

### Personal Space Algorithm

```javascript
maintainPersonalSpace(playerPos, delta) {
  if (!this.config.personalSpace.enabled || !playerPos) {
    return false;
  }
  
  const dx = this.sprite.x - playerPos.x;  // Away from player
  const dy = this.sprite.y - playerPos.y;
  const distanceSq = dx * dx + dy * dy;
  
  // Player too close?
  if (distanceSq < this.config.personalSpace.distanceSq) {
    const distance = Math.sqrt(distanceSq);
    
    // Back away slowly in small increments (5px at a time)
    const backAwayDist = this.config.personalSpace.backAwayDistance;
    const targetX = this.sprite.x + (dx / distance) * backAwayDist;
    const targetY = this.sprite.y + (dy / distance) * backAwayDist;
    
    // Smoothly move to target
    const moveSpeed = this.config.personalSpace.backAwaySpeed;
    const moveX = (targetX - this.sprite.x);
    const moveY = (targetY - this.sprite.y);
    
    this.sprite.body.setVelocity(moveX * moveSpeed, moveY * moveSpeed);
    
    // Still face the player while backing away
    this.direction = this.calculateDirection(-dx, -dy);  // Negative = face player
    this.playAnimation('idle', this.direction);  // Use idle, not walk
    
    this.isMoving = false;  // Not "walking", just adjusting position
    this.backingAway = true;
    
    return true;  // Personal space behavior active
  }
  
  this.backingAway = false;
  return false;  // No violation
}
```

**Design Notes**:
- Distance: 48px (1.5 tiles) - smaller than interaction range (64px)
- Speed: 30 px/s - slow, subtle backing
- Increment: 5px - small adjustments to stay within interaction range
- Animation: Use 'idle' animation while backing (face player, maintain eye contact)
- NPC backs away but remains interactive

---

## Depth Calculation

Reuse player depth calculation pattern:

```javascript
updateDepth() {
  if (!this.sprite || !this.sprite.body) return;
  
  // Get bottom of sprite (feet position)
  const spriteBottomY = this.sprite.y + (this.sprite.displayHeight / 2);
  
  // Same formula as player: bottomY + 0.5
  const depth = spriteBottomY + 0.5;
  this.sprite.setDepth(depth);
}
```

Called:
- Every update cycle (REQUIRED for proper Y-axis rendering order)
- Depth determines draw order as NPCs move up/down

**Note**: Depth updates are NOT optional - they ensure NPCs render correctly relative to each other and the player as they move along the Y-axis.

---

## Ink Integration

### Tag Processing Flow

```
Ink Story (e.g., scenarios/ink/guard.json)
    ↓
    # hostile
    # influence:-25
    ↓
Person Chat Minigame (person-chat-minigame.js)
    ↓
    processInkTags(tags, npcId)
    ↓
NPC Game Bridge (npc-game-bridge.js)
    ↓
    setNPCHostile(npcId, true)
    setNPCInfluence(npcId, -25)
    ↓
NPC Behavior Manager (npc-behavior.js)
    ↓
    setBehaviorState(npcId, 'hostile', true)
    setBehaviorState(npcId, 'influence', -25)
    ↓
NPC Behavior (npc-behavior.js)
    ↓
    setState('hostile', true) → setHostile(true)
    setState('influence', -25) → setInfluence(-25)
    ↓
Visual Effect: sprite.setTint(0xff6666)
State Change: Update hostile state
```

### Tag Handler Implementation

In `js/systems/npc-game-bridge.js`:

```javascript
class NPCGameBridge {
  // ... existing methods ...
  
  setNPCHostile(npcId, hostile) {
    if (!window.npcBehaviorManager) {
      console.warn('NPCBehaviorManager not initialized');
      return;
    }
    
    const behavior = window.npcBehaviorManager.getBehavior(npcId);
    if (behavior) {
      behavior.setState('hostile', hostile);
      console.log(`🔴 NPC ${npcId} hostile: ${hostile}`);
      
      this._logAction('setNPCHostile', { npcId, hostile }, { success: true });
    } else {
      console.warn(`Behavior not found for NPC: ${npcId}`);
    }
  }
  
  setNPCInfluence(npcId, influence) {
    if (!window.npcBehaviorManager) return;
    
    const behavior = window.npcBehaviorManager.getBehavior(npcId);
    if (behavior) {
      behavior.setState('influence', influence);
      console.log(`💯 NPC ${npcId} influence: ${influence}`);
      
      // Check if influence change should trigger hostile state
      this._updateNPCBehaviorFromInfluence(npcId, influence);
      
      this._logAction('setNPCInfluence', { npcId, influence }, { success: true });
    }
  }
  
  setNPCPatrol(npcId, enabled) {
    if (!window.npcBehaviorManager) return;
    
    const behavior = window.npcBehaviorManager.getBehavior(npcId);
    if (behavior) {
      behavior.setState('patrol', enabled);
      console.log(`🚶 NPC ${npcId} patrol: ${enabled}`);
      
      this._logAction('setNPCPatrol', { npcId, enabled }, { success: true });
    }
  }
  
  setNPCPersonalSpace(npcId, distance) {
    if (!window.npcBehaviorManager) return;
    
    const behavior = window.npcBehaviorManager.getBehavior(npcId);
    if (behavior) {
      behavior.setState('personalSpaceDistance', distance);
      console.log(`↔️ NPC ${npcId} personal space: ${distance}px`);
      
      this._logAction('setNPCPersonalSpace', { npcId, distance }, { success: true });
    }
  }
  
  _updateNPCBehaviorFromInfluence(npcId, influence) {
    const behavior = window.npcBehaviorManager.getBehavior(npcId);
    if (!behavior) return;
    
    const threshold = behavior.config.hostile.influenceThreshold;
    
    // Auto-trigger hostile if influence drops below threshold
    if (influence < threshold && !behavior.hostile) {
      this.setNPCHostile(npcId, true);
      console.log(`⚠️ NPC ${npcId} became hostile due to low influence (${influence} < ${threshold})`);
    }
    // Auto-disable hostile if influence recovers
    else if (influence >= threshold && behavior.hostile) {
      this.setNPCHostile(npcId, false);
      console.log(`✅ NPC ${npcId} no longer hostile (influence: ${influence})`);
    }
  }
}
```

In `js/minigames/person-chat/person-chat-minigame.js`:

```javascript
// Add to existing tag processing
function processInkTags(tags, npcId) {
  for (const tag of tags) {
    // ... existing tag handlers ...
    
    // NEW: Behavior tags
    if (tag === 'hostile' || tag === 'hostile:true') {
      window.npcGameBridge.setNPCHostile(npcId, true);
    } else if (tag === 'hostile:false') {
      window.npcGameBridge.setNPCHostile(npcId, false);
    } else if (tag.startsWith('influence:')) {
      const value = parseInt(tag.split(':')[1], 10);
      if (!isNaN(value)) {
        window.npcGameBridge.setNPCInfluence(npcId, value);
      }
    } else if (tag === 'patrol_mode:on') {
      window.npcGameBridge.setNPCPatrol(npcId, true);
    } else if (tag === 'patrol_mode:off') {
      window.npcGameBridge.setNPCPatrol(npcId, false);
    } else if (tag.startsWith('personal_space:')) {
      const distance = parseInt(tag.split(':')[1], 10);
      if (!isNaN(distance) && distance >= 0) {
        window.npcGameBridge.setNPCPersonalSpace(npcId, distance);
      }
    }
  }
}
```

---

## Performance Optimization

### Update Throttling

```javascript
// In NPCBehaviorManager.update()

update(time, delta) {
  // Only update every 50ms (20 updates/sec instead of 60)
  if (time - this.lastUpdate < this.updateInterval) {
    return;
  }
  this.lastUpdate = time;
  
  // Get player position once per update
  const playerPos = window.player ? {
    x: window.player.x,
    y: window.player.y
  } : null;
  
  // Update all behaviors
  for (const [npcId, behavior] of this.behaviors) {
    behavior.update(time, delta, playerPos);
  }
}
```

### Distance Caching

```javascript
// Pre-calculate squared distances in config parsing
config.facePlayerDistanceSq = config.facePlayerDistance ** 2;
config.personalSpace.distanceSq = config.personalSpace.distance ** 2;
config.hostile.aggroDistanceSq = config.hostile.aggroDistance ** 2;

// Use squared distances in comparisons (avoid sqrt)
const distanceSq = dx * dx + dy * dy;
if (distanceSq < this.config.facePlayerDistanceSq) {
  // Face player
}
```

### Animation Caching

```javascript
// Only change animation if different
if (this.lastAnimationKey !== animKey) {
  this.sprite.play(animKey, true);
  this.lastAnimationKey = animKey;
}
```

### Spatial Culling (Future)

```javascript
// Skip update if NPC not in visible room
if (this.roomId !== window.currentRoom) {
  this.sprite.body.setVelocity(0, 0);
  return;
}
```

---

## Error Handling

### Graceful Degradation

```javascript
// In NPCBehavior.update()
update(time, delta, playerPos) {
  try {
    // Comprehensive sprite validation (including .destroyed check)
    if (!this.sprite || !this.sprite.body || this.sprite.destroyed) {
      console.warn(`⚠️ Invalid sprite for ${this.npcId}, skipping update`);
      return;
    }
    
    // Main update logic...
    
  } catch (error) {
    console.error(`Error updating NPC behavior ${this.npcId}:`, error);
    // Reset to idle state on error
    this.currentState = 'idle';
    if (this.sprite && this.sprite.body && !this.sprite.destroyed) {
      this.sprite.body.setVelocity(0, 0);
    }
  }
}
```

### NPCBehavior Constructor

```javascript
constructor(npcId, sprite, config, scene) {
  this.npcId = npcId;
  this.sprite = sprite;
  this.scene = scene;
  
  // CRITICAL: Get roomId from NPC data at initialization
  const npcData = window.npcManager?.npcs.get(npcId);
  this.roomId = npcData?.roomId || null;
  
  if (!this.roomId) {
    console.warn(`⚠️ NPC ${npcId} has no roomId - patrol bounds will be limited`);
  }
  
  // Verify sprite reference matches npcData._sprite
  if (npcData && npcData._sprite && npcData._sprite !== sprite) {
    console.warn(`⚠️ Sprite reference mismatch for ${npcId}`);
  }
  
  // Parse and merge configuration
  this.config = this.parseConfig(config);
  
  // Initialize state
  this.state = 'idle';
  this.direction = 'down';
  this.isMoving = false;
  this.hostile = this.config.hostile.defaultState;
  this.influence = 0;
  
  // Patrol state
  this.patrolTarget = null;
  this.stuckTimer = 0;
  this.lastDirectionChange = 0;
  
  // Animation tracking
  this.lastAnimationKey = null;
  
  // Apply initial hostile visual if needed
  if (this.hostile) {
    this.setHostile(true);
  }
  
  console.log(`✅ Behavior registered for ${npcId} in room ${this.roomId}`);
}
```

**Note**: Sprite storage locations:
- `npcData._sprite` - Set in npc-sprites.js line 69
- `roomData.npcSprites[]` - Array in rooms.js line 1894
- Both should reference the same sprite object

### Config Validation

```javascript
parseConfig(userConfig) {
  const config = { ...DEFAULT_CONFIG };
  
  // Validate patrol speed
  if (userConfig.patrol && userConfig.patrol.speed !== undefined) {
    if (typeof userConfig.patrol.speed === 'number' && userConfig.patrol.speed > 0) {
      config.patrol.speed = userConfig.patrol.speed;
    } else {
      console.warn(`Invalid patrol speed for NPC ${this.npcId}, using default`);
    }
  }
  
  // Validate distances (must be positive)
  if (userConfig.personalSpace && userConfig.personalSpace.distance !== undefined) {
    if (typeof userConfig.personalSpace.distance === 'number' && 
        userConfig.personalSpace.distance >= 0) {
      config.personalSpace.distance = userConfig.personalSpace.distance;
      config.personalSpace.distanceSq = config.personalSpace.distance ** 2;
    } else {
      console.warn(`Invalid personal space distance for NPC ${this.npcId}`);
    }
  }
  
  return config;
}
```

---

## Testing Checklist

### Unit Tests (Manual)

- [ ] Direction calculation (8 directions + edge cases)
- [ ] Distance calculation (squared distances)
- [ ] Config parsing (defaults, overrides, validation)
- [ ] State priority (higher priority overrides lower)
- [ ] Animation key generation (correct format)

### Integration Tests

- [ ] Single NPC faces player when approached
- [ ] Multiple NPCs face player independently
- [ ] NPC patrols and changes direction
- [ ] NPC handles collision while patrolling
- [ ] NPC recovers from stuck state
- [ ] NPC backs away when player too close
- [ ] Hostile state applies red tint
- [ ] Ink tag changes behavior in real-time
- [ ] Personal space + patrol interaction
- [ ] Face player + patrol interaction

### Performance Tests

- [ ] 1 NPC: FPS impact < 2%
- [ ] 5 NPCs: FPS impact < 5%
- [ ] 10 NPCs: FPS impact < 10%
- [ ] Update throttling working (50ms interval)
- [ ] No memory leaks after 5 minutes

### Edge Cases

- [ ] Player sprite missing (shouldn't crash)
- [ ] NPC sprite destroyed mid-update
- [ ] Invalid config (uses defaults)
- [ ] No patrol bounds defined (uses room size)
- [ ] Zero personal space distance
- [ ] Negative influence values
- [ ] Room change while patrolling

---

## Future Enhancements

### Short-term (Post-MVP)

1. **Chase Behavior**: Hostile NPC moves towards player
   ```javascript
   updateChase(playerPos, delta) {
     const dx = playerPos.x - this.sprite.x;
     const dy = playerPos.y - this.sprite.y;
     const distance = Math.sqrt(dx * dx + dy * dy);
     
     const velocityX = (dx / distance) * this.config.hostile.chaseSpeed;
     const velocityY = (dy / distance) * this.config.hostile.chaseSpeed;
     this.sprite.body.setVelocity(velocityX, velocityY);
     
     this.direction = this.calculateDirection(dx, dy);
     this.playAnimation('walk', this.direction);
   }
   ```

2. **Flee Behavior**: Hostile NPC runs away from player
   ```javascript
   updateFlee(playerPos, delta) {
     const dx = this.sprite.x - playerPos.x;  // Away from player
     const dy = this.sprite.y - playerPos.y;
     const distance = Math.sqrt(dx * dx + dy * dy);
     
     const velocityX = (dx / distance) * this.config.hostile.fleeSpeed;
     const velocityY = (dy / distance) * this.config.hostile.fleeSpeed;
     this.sprite.body.setVelocity(velocityX, velocityY);
     
     this.direction = this.calculateDirection(dx, dy);
     this.playAnimation('walk', this.direction);
   }
   ```

3. **Waypoint Patrol**: Follow predefined path
   ```json
   {
     "patrol": {
       "enabled": true,
       "waypoints": [
         { "x": 5, "y": 3 },
         { "x": 10, "y": 3 },
         { "x": 10, "y": 8 },
         { "x": 5, "y": 8 }
       ],
       "loop": true
     }
   }
   ```

4. **Debug Visualization**: Show ranges, paths, state
   ```javascript
   if (window.NPC_BEHAVIOR_DEBUG_VISUAL) {
     // Draw face player range
     graphics.strokeCircle(sprite.x, sprite.y, config.facePlayerDistance);
     
     // Draw personal space range
     graphics.strokeCircle(sprite.x, sprite.y, config.personalSpace.distance);
     
     // Draw patrol target
     graphics.fillCircle(patrolTarget.x, patrolTarget.y, 5);
   }
   ```

### Long-term

1. **Pathfinding**: Use EasyStar.js like player
2. **Group Behaviors**: NPCs follow leader
3. **Emotion System**: Happy, sad, angry states
4. **Dynamic Scheduling**: Time-based behaviors
5. **NPC-to-NPC Interactions**: NPCs talk to each other
6. **Animation Blending**: Smooth transitions
7. **Spatial Partitioning**: Room-based culling

---

**Document Status**: Technical Specification v1.0
**Last Updated**: 2025-11-09
**Author**: AI Coding Agent
