# NPC Sprite System Architecture

## Overview
This document details how in-person NPCs are created, managed, and rendered as Phaser sprite objects in the game world.

## Core Concepts

### NPC Sprite vs Player Sprite
| Aspect | Player | NPC |
|--------|--------|-----|
| Control | Keyboard/mouse controlled | Static or scripted |
| Quantity | Single instance | Multiple instances |
| Camera | Camera follows | In camera view |
| Collision | Dynamic movement | Static collision body |
| Animations | Full movement set | Idle + optional greet/talk |

### Sprite Management Architecture
```
NPCManager (js/systems/npc-manager.js)
    ├── Manages NPC data and Ink stories
    └── Delegates sprite creation to NPCSpriteManager

NPCSpriteManager (js/systems/npc-sprites.js) [NEW]
    ├── Creates Phaser sprite instances
    ├── Positions NPCs in rooms
    ├── Handles animations and updates
    └── Manages collision bodies

RoomsSystem (js/core/rooms.js)
    ├── Calls NPCSpriteManager during room loading
    └── Updates NPC visibility based on room state
```

## NPCSpriteManager Module

### Location
`js/systems/npc-sprites.js`

### Responsibilities
1. **Sprite Creation**: Generate Phaser sprite objects for NPCs
2. **Positioning**: Place NPCs at correct world coordinates
3. **Animation Setup**: Initialize idle/greet/talk animations
4. **Depth Management**: Calculate and set proper depth values
5. **Collision**: Create physics bodies for NPC sprites
6. **State Updates**: Handle animation state changes
7. **Cleanup**: Remove sprites when rooms unload

### Key Functions

#### `createNPCSprite(game, npc, roomData)`
Creates a single NPC sprite instance.

```javascript
/**
 * Create an NPC sprite in the game world
 * @param {Phaser.Game} game - Phaser game instance
 * @param {Object} npc - NPC data from scenario
 * @param {Object} roomData - Room information (for positioning)
 * @returns {Phaser.Sprite} Created sprite instance
 */
export function createNPCSprite(game, npc, roomData) {
    // Extract sprite configuration
    const spriteSheet = npc.spriteSheet || 'hacker';
    const config = npc.spriteConfig || {};
    const idleFrame = config.idleFrame || 20;
    
    // Calculate world position
    const worldPos = calculateNPCWorldPosition(npc, roomData);
    
    // Create sprite
    const sprite = game.add.sprite(worldPos.x, worldPos.y, spriteSheet, idleFrame);
    sprite.npcId = npc.id; // Tag for identification
    
    // Enable physics
    game.physics.arcade.enable(sprite);
    sprite.body.immovable = true; // NPCs don't move on collision
    sprite.body.setSize(32, 32); // Collision body size
    sprite.body.setOffset(16, 32); // Offset for feet position
    
    // Set up animations
    setupNPCAnimations(game, sprite, spriteSheet, config);
    
    // Start idle animation
    sprite.play(`npc-${npc.id}-idle`, true);
    
    // Set depth (same system as player)
    updateNPCDepth(sprite);
    
    // Store reference in NPC data
    npc._sprite = sprite;
    
    return sprite;
}
```

#### `calculateNPCWorldPosition(npc, roomData)`
Converts scenario position to world coordinates.

```javascript
/**
 * Calculate NPC's world position from scenario data
 * @param {Object} npc - NPC data with position property
 * @param {Object} roomData - Room data for offset calculation
 * @returns {Object} {x, y} world coordinates
 */
function calculateNPCWorldPosition(npc, roomData) {
    const position = npc.position || { x: 5, y: 5 };
    
    // Support both grid coordinates and pixel coordinates
    if (position.px !== undefined && position.py !== undefined) {
        // Absolute pixel coordinates
        return { x: position.px, y: position.py };
    } else {
        // Grid coordinates (tiles)
        const TILE_SIZE = 32; // Import from constants
        const roomWorldX = roomData.worldX || 0;
        const roomWorldY = roomData.worldY || 0;
        
        return {
            x: roomWorldX + (position.x * TILE_SIZE),
            y: roomWorldY + (position.y * TILE_SIZE)
        };
    }
}
```

#### `setupNPCAnimations(game, sprite, spriteSheet, config)`
Creates animation sequences for NPC sprite.

```javascript
/**
 * Set up animations for an NPC sprite
 * @param {Phaser.Game} game - Phaser game instance
 * @param {Phaser.Sprite} sprite - NPC sprite
 * @param {string} spriteSheet - Texture key
 * @param {Object} config - Animation configuration
 */
function setupNPCAnimations(game, sprite, spriteSheet, config) {
    const npcId = sprite.npcId;
    const animPrefix = config.animPrefix || 'idle';
    
    // Idle animation (facing down by default)
    // For hacker sprite: frames 20-23 = idle-down
    game.anims.create({
        key: `npc-${npcId}-idle`,
        frames: game.anims.generateFrameNumbers(spriteSheet, { 
            start: config.idleFrameStart || 20, 
            end: config.idleFrameEnd || 23 
        }),
        frameRate: 4,
        repeat: -1
    });
    
    // Optional: Greeting animation (wave or nod)
    if (config.greetFrameStart) {
        game.anims.create({
            key: `npc-${npcId}-greet`,
            frames: game.anims.generateFrameNumbers(spriteSheet, {
                start: config.greetFrameStart,
                end: config.greetFrameEnd
            }),
            frameRate: 8,
            repeat: 0
        });
    }
    
    // Optional: Talking animation (subtle movement)
    if (config.talkFrameStart) {
        game.anims.create({
            key: `npc-${npcId}-talk`,
            frames: game.anims.generateFrameNumbers(spriteSheet, {
                start: config.talkFrameStart,
                end: config.talkFrameEnd
            }),
            frameRate: 6,
            repeat: -1
        });
    }
}
```

#### `updateNPCDepth(sprite)`
Calculates and sets correct depth value.

```javascript
/**
 * Update NPC sprite depth based on Y position
 * Uses same system as player (bottomY + 0.5)
 * @param {Phaser.Sprite} sprite - NPC sprite to update
 */
function updateNPCDepth(sprite) {
    // Get the bottom of the sprite (feet position)
    const spriteBottomY = sprite.y + (sprite.displayHeight / 2);
    
    // Set depth using standard formula
    const depth = spriteBottomY + 0.5; // World Y + sprite layer offset
    sprite.setDepth(depth);
}
```

#### `createNPCCollision(game, sprite, player)`
Sets up collision between NPC and player.

```javascript
/**
 * Create collision between NPC sprite and player
 * @param {Phaser.Game} game - Phaser game instance
 * @param {Phaser.Sprite} sprite - NPC sprite
 * @param {Phaser.Sprite} player - Player sprite
 */
function createNPCCollision(game, sprite, player) {
    // Add collider so player can't walk through NPC
    game.physics.add.collider(player, sprite);
    
    // Optional: Add collision callback for events
    sprite.body.onCollide = true;
}
```

## Integration with Rooms System

### Room Loading Flow
```javascript
// In js/core/rooms.js - loadRoom() function

function loadRoom(roomId) {
    // ... existing room loading code ...
    
    // After creating room tiles/objects, create NPC sprites
    createNPCSpritesForRoom(roomId, roomData);
}

function createNPCSpritesForRoom(roomId, roomData) {
    // Get all NPCs that should appear in this room
    const npcsInRoom = getNPCsForRoom(roomId);
    
    npcsInRoom.forEach(npc => {
        if (npc.npcType === 'person' || npc.npcType === 'both') {
            const sprite = window.NPCSpriteManager.createNPCSprite(
                window.game,
                npc,
                roomData
            );
            
            // Store sprite reference for cleanup
            if (!roomData.npcSprites) {
                roomData.npcSprites = [];
            }
            roomData.npcSprites.push(sprite);
            
            // Set up collision with player
            if (window.player) {
                window.NPCSpriteManager.createNPCCollision(
                    window.game,
                    sprite,
                    window.player
                );
            }
        }
    });
}

function getNPCsForRoom(roomId) {
    if (!window.npcManager) return [];
    
    const allNPCs = Array.from(window.npcManager.npcs.values());
    return allNPCs.filter(npc => npc.roomId === roomId);
}
```

### Room Unloading
```javascript
// In js/core/rooms.js - unloadRoom() function

function unloadRoom(roomId) {
    const roomData = rooms[roomId];
    
    // Destroy NPC sprites
    if (roomData.npcSprites) {
        roomData.npcSprites.forEach(sprite => {
            if (sprite && !sprite.destroyed) {
                sprite.destroy();
            }
        });
        roomData.npcSprites = [];
    }
    
    // ... existing room cleanup code ...
}
```

## Sprite Animation States

### State Machine
```
Idle (default)
    ↓ (player approaches)
Greeting (optional, brief)
    ↓ (player interacts)
Talking (during conversation)
    ↓ (conversation ends)
Idle (returns to default)
```

### Triggering Animations
```javascript
// When player approaches (in interaction system)
function onPlayerApproachNPC(npc) {
    if (npc._sprite && npc._sprite.anims.exists(`npc-${npc.id}-greet`)) {
        npc._sprite.play(`npc-${npc.id}-greet`);
        
        // Return to idle after greeting finishes
        npc._sprite.once('animationcomplete', () => {
            npc._sprite.play(`npc-${npc.id}-idle`, true);
        });
    }
}

// When conversation starts
function onConversationStart(npc) {
    if (npc._sprite && npc._sprite.anims.exists(`npc-${npc.id}-talk`)) {
        npc._sprite.play(`npc-${npc.id}-talk`, true);
    }
}

// When conversation ends
function onConversationEnd(npc) {
    if (npc._sprite) {
        npc._sprite.play(`npc-${npc.id}-idle`, true);
    }
}
```

## Scenario Configuration

### Basic NPC Sprite
```json
{
  "id": "guard_mike",
  "displayName": "Security Guard Mike",
  "npcType": "person",
  "roomId": "lobby",
  "position": { "x": 8, "y": 5 },
  "spriteSheet": "hacker",
  "spriteConfig": {
    "idleFrame": 20,
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  }
}
```

### Advanced NPC with Animations
```json
{
  "id": "tech_alex",
  "displayName": "Alex the Sysadmin",
  "npcType": "both",
  "roomId": "server1",
  "position": { "px": 640, "py": 480 },
  "spriteSheet": "hacker",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23,
    "greetFrameStart": 24,
    "greetFrameEnd": 27,
    "talkFrameStart": 28,
    "talkFrameEnd": 31
  },
  "interactionDistance": 80
}
```

## Performance Considerations

### Sprite Pooling (Future)
For scenarios with many NPCs:
```javascript
class NPCSpritePool {
    constructor(game, maxSize = 10) {
        this.pool = [];
        this.active = [];
        this.game = game;
        this.maxSize = maxSize;
    }
    
    acquire(npcData) {
        let sprite = this.pool.pop();
        if (!sprite) {
            sprite = this.createNewSprite();
        }
        this.configureSprite(sprite, npcData);
        this.active.push(sprite);
        return sprite;
    }
    
    release(sprite) {
        sprite.visible = false;
        const index = this.active.indexOf(sprite);
        if (index !== -1) {
            this.active.splice(index, 1);
        }
        if (this.pool.length < this.maxSize) {
            this.pool.push(sprite);
        } else {
            sprite.destroy();
        }
    }
}
```

### LOD (Level of Detail)
For distant NPCs:
- Disable animations when far from player
- Use static sprite when off-screen
- Reduce update frequency

## Testing Strategy

### Unit Tests
- Position calculation (grid → world coordinates)
- Depth calculation (bottomY + offset)
- Animation state transitions

### Integration Tests
- NPC appears in correct room
- Collision works with player
- Depth sorting with other entities
- Animation plays correctly

### Visual Tests
- Create test scenario with multiple NPCs
- Verify positioning and layering
- Test animation transitions
- Check collision boundaries

## Example Test Scenario
```json
{
  "scenario_brief": "NPC Sprite Test",
  "startRoom": "test_room",
  "npcs": [
    {
      "id": "npc_front",
      "displayName": "Front NPC",
      "npcType": "person",
      "roomId": "test_room",
      "position": { "x": 5, "y": 3 },
      "spriteSheet": "hacker"
    },
    {
      "id": "npc_back",
      "displayName": "Back NPC",
      "npcType": "person",
      "roomId": "test_room",
      "position": { "x": 5, "y": 7 },
      "spriteSheet": "hacker"
    }
  ],
  "rooms": {
    "test_room": {
      "type": "room_office",
      "connections": {}
    }
  }
}
```

Expected behavior:
- Both NPCs visible in test_room
- npc_back renders behind npc_front (higher Y = behind)
- Player can walk between them
- Depth sorting works correctly

## Next Steps
1. Implement NPCSpriteManager module
2. Integrate with rooms.js loading system
3. Add NPC sprite creation to NPCManager.registerNPC()
4. Create test scenario for validation
5. Document sprite sheet frame mapping conventions
