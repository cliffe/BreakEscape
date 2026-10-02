# NPC Hostile State Implementation Plan

## Overview

This document outlines the implementation of a hostile state for NPCs, enabling combat mechanics, health systems, and game-over conditions in the BreakEscape game.

## System Architecture

### Core Components

1. **NPC Hostile State System** - Track and manage hostile NPCs
2. **Player Health System** - HP tracking, damage, and UI display
3. **NPC Health System** - NPC HP and health bar display
4. **Combat System** - Punch mechanics for both player and NPCs
5. **Ink Tag Integration** - Trigger hostile state from dialogue
6. **Animation System** - Placeholder combat animations
7. **Game Over State** - KO mechanics and game over screen

## Detailed Implementation Steps

### Phase 1: Data Structures and State Management

#### 1.1 Player Health State

**File**: `/js/systems/player-health.js` (NEW)

Create a new module to manage player health:

```javascript
// Global state
const PLAYER_MAX_HP = 100;
const PLAYER_MAX_HEARTS = 5;
let playerCurrentHP = PLAYER_MAX_HP;
let isPlayerKO = false;

// Functions to implement:
- initPlayerHealth() - Initialize health state
- getPlayerHP() - Return current HP
- setPlayerHP(hp) - Set HP with bounds checking
- damagePlayer(amount) - Reduce HP by amount
- healPlayer(amount) - Increase HP by amount
- isPlayerKO() - Check if player is knocked out
- resetPlayerHealth() - Reset to full HP
```

**Integration Points**:
- Call `initPlayerHealth()` in main game initialization
- Add to `window` object for global access
- Emit events when HP changes: `player_hp_changed`, `player_ko`

#### 1.2 NPC Hostile State

**File**: `/js/systems/npc-hostile.js` (NEW)

Create hostile state management system:

```javascript
// Per-NPC hostile state tracking
const npcHostileStates = new Map(); // npcId -> state object

// State object structure:
{
  isHostile: false,
  currentHP: 100,
  maxHP: 100,
  isKO: false,
  attackCooldown: 0,
  lastAttackTime: 0,
  chaseTarget: null, // player reference or null
  attackDamage: 10,  // configurable
  attackRange: 50,
  attackCooldownMs: 2000
}

// Functions to implement:
- initNPCHostileSystem() - Initialize the system
- setNPCHostile(npcId, isHostile) - Toggle hostile state
- isNPCHostile(npcId) - Check if NPC is hostile
- getNPCHostileState(npcId) - Get full state object
- damageNPC(npcId, amount) - Reduce NPC HP
- isNPCKO(npcId) - Check if NPC is knocked out
- updateNPCHostileState(npcId, delta) - Update cooldowns etc.
- canNPCAttack(npcId) - Check if attack is off cooldown
```

**Integration Points**:
- Initialize in main game setup
- Add to `window.npcHostileSystem` for global access
- Emit events: `npc_hostile_state_changed`, `npc_ko`

#### 1.3 Configuration System

**File**: `/js/config/combat-config.js` (NEW)

Centralize combat configuration:

```javascript
export const COMBAT_CONFIG = {
  player: {
    maxHP: 100,
    punchDamage: 20,
    punchRange: 60,
    punchAnimationDuration: 500, // milliseconds
    punchCooldown: 1000
  },
  npc: {
    defaultMaxHP: 100,
    defaultPunchDamage: 10,
    defaultPunchRange: 50,
    defaultAttackCooldown: 2000,
    chaseSpeed: 120, // pixels per second
    chaseRange: 400, // LOS range when hostile
    attackStopDistance: 45 // stop this close to punch
  },
  ui: {
    maxHearts: 5,
    heartFullSprite: '❤️',
    heartHalfSprite: '💔',
    heartEmptySprite: '🖤',
    healthBarWidth: 60,
    healthBarHeight: 6,
    healthBarOffsetY: -40
  }
};
```

### Phase 2: UI Components

#### 2.1 Player Health Display

**File**: `/js/systems/player-health-ui.js` (NEW)

Create heart-based health display above inventory:

```javascript
// HTML structure to add:
<div id="player-health-container" style="display: none;">
  <div id="player-hearts"></div>
</div>

// Functions:
- initPlayerHealthUI() - Create HTML elements
- updatePlayerHealthUI() - Render hearts based on current HP
- showPlayerHealthUI() - Display when HP < max
- hidePlayerHealthUI() - Hide when HP = max
- calculateHearts(hp) - Convert HP to heart display
  * 100 HP = 5 full hearts
  * Each heart = 20 HP
  * Half hearts at 10 HP increments
```

**CSS Styling**:
```css
#player-health-container {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 100;
}

#player-hearts {
  display: flex;
  gap: 4px;
  font-size: 24px;
}
```

**Integration**:
- Initialize in main game setup
- Listen to `player_hp_changed` event to update
- Position above inventory container

#### 2.2 NPC Health Bars

**File**: `/js/systems/npc-health-ui.js` (NEW)

Create health bars that float above hostile NPCs:

```javascript
// Phaser Graphics objects above NPC sprites
const npcHealthBars = new Map(); // npcId -> graphics object

// Functions:
- initNPCHealthUI(scene) - Initialize system
- createNPCHealthBar(scene, npcId, npc) - Create bar for NPC
- updateNPCHealthBar(npcId, currentHP, maxHP) - Update bar fill
- hideNPCHealthBar(npcId) - Hide when not hostile
- showNPCHealthBar(npcId) - Show when hostile
- destroyNPCHealthBar(npcId) - Remove when NPC KO
- positionHealthBar(npcId, x, y) - Update position above sprite
```

**Visual Design**:
- Green fill for health remaining
- Red/black background
- White border
- Position 40px above NPC sprite
- Update every frame to follow NPC

**Integration**:
- Create bar when NPC becomes hostile
- Update in NPC behavior update loop
- Destroy when NPC is KO

#### 2.3 Game Over Screen

**File**: `/js/systems/game-over-ui.js` (NEW)

Create game over overlay when player is KO:

```javascript
// HTML overlay
<div id="game-over-overlay" style="display: none;">
  <div id="game-over-content">
    <h1>GAME OVER</h1>
    <p>You were knocked out!</p>
    <button id="restart-button">Restart</button>
  </div>
</div>

// Functions:
- initGameOverUI() - Create overlay
- showGameOver() - Display game over screen
- hideGameOver() - Hide overlay
- handleRestart() - Reload game or reset state
```

**CSS Styling**:
```css
#game-over-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

#game-over-content {
  background: #1a1a1a;
  border: 3px solid #ff0000;
  padding: 40px;
  text-align: center;
  color: #fff;
}
```

**Integration**:
- Listen to `player_ko` event
- Disable player controls when shown
- Implement restart functionality

### Phase 3: Combat Mechanics

#### 3.1 Player Punch System

**File**: `/js/systems/player-combat.js` (NEW)

Implement player punching mechanics:

```javascript
let playerPunchCooldown = 0;
let isPunching = false;

// Functions:
- initPlayerCombat() - Setup combat system
- canPlayerPunch() - Check cooldown and state
- playerPunch(targetNPC) - Execute punch action
  * Play punch animation (walk animation + red tint)
  * Check range at end of animation
  * Apply damage if in range
  * Trigger cooldown
- updatePlayerCombat(delta) - Update cooldowns
- getHostileNPCsInRange() - Find hostile NPCs near player
```

**Punch Flow**:
1. Player presses punch key (e.g., SPACE) near hostile NPC
2. Check if can punch (cooldown, not already punching)
3. Play placeholder animation (walk + red tint)
4. After animation delay (500ms), check range
5. If NPC still in range, apply damage
6. Reset tint and start cooldown

**Integration**:
- Add punch key binding in player controls
- Modify interaction system to show "punch" option near hostile NPCs
- Hook into existing animation system

#### 3.2 NPC Attack System

**File**: `/js/systems/npc-combat.js` (NEW)

Implement NPC punching mechanics:

```javascript
// Functions:
- initNPCCombat() - Setup NPC combat
- npcAttack(npcId, npc) - Execute NPC punch
  * Play punch animation (walk + red tint)
  * Check if player in range
  * Apply damage to player
  * Start cooldown
- canNPCAttack(npcId, npc, playerPos) - Check range and cooldown
- updateNPCCombat(delta) - Update all NPC attack states
```

**Attack Flow**:
1. Hostile NPC is within attack range of player
2. Check if can attack (cooldown)
3. Stop movement
4. Play punch animation
5. After animation, check if player still in range
6. Apply damage if so
7. Start cooldown
8. Resume movement/chase

**Integration**:
- Call from NPC behavior update loop
- Check attack conditions each frame for hostile NPCs
- Coordinate with movement system (stop to punch)

### Phase 4: NPC Behavior Extensions

#### 4.1 Hostile Behavior Mode

**File**: `/js/systems/npc-behavior.js` (MODIFY)

Extend existing behavior system to handle hostile state:

**Changes Required**:

1. Add hostile behavior check in update loop:
```javascript
// In updateNPCBehaviors()
for (const npc of npcs) {
  // Check if NPC is hostile
  if (window.npcHostileSystem?.isNPCHostile(npc.id)) {
    updateHostileBehavior(npc, playerPosition, delta);
  } else {
    // Existing patrol/facePlayer behavior
    updateNormalBehavior(npc, playerPosition, delta);
  }
}
```

2. Implement `updateHostileBehavior()`:
```javascript
function updateHostileBehavior(npc, playerPosition, delta) {
  // Enable LOS if not already enabled
  if (!npc.los?.enabled) {
    npc.los = { enabled: true, range: 400, angle: 360 };
  }

  // Check if player in LOS
  const inLOS = isInLineOfSight(npc, { x: playerPosition.x, y: playerPosition.y }, npc.los);

  if (inLOS) {
    // Chase player
    moveNPCTowardsTarget(npc, playerPosition);

    // Check if in attack range
    const distance = Phaser.Math.Distance.Between(
      npc.sprite.x, npc.sprite.y,
      playerPosition.x, playerPosition.y
    );

    if (distance <= COMBAT_CONFIG.npc.defaultPunchRange) {
      // Stop and attack
      stopNPCMovement(npc);
      if (window.npcCombat?.canNPCAttack(npc.id, npc, playerPosition)) {
        window.npcCombat.npcAttack(npc.id, npc);
      }
    }
  } else {
    // Lost sight of player, continue patrol or search
    // Could add search behavior here
    updateNormalBehavior(npc, playerPosition, delta);
  }
}
```

3. Implement `moveNPCTowardsTarget()`:
```javascript
function moveNPCTowardsTarget(npc, targetPosition) {
  // Use pathfinding or direct movement
  const pathfinder = window.pathfinders?.[npc.roomId];
  if (pathfinder) {
    // Convert positions to grid coordinates
    const npcGridPos = worldToGrid(npc.sprite.x, npc.sprite.y);
    const targetGridPos = worldToGrid(targetPosition.x, targetPosition.y);

    // Find path and move
    pathfinder.findPath(
      npcGridPos.x, npcGridPos.y,
      targetGridPos.x, targetGridPos.y,
      (path) => {
        if (path) {
          moveNPCAlongPath(npc, path, COMBAT_CONFIG.npc.chaseSpeed);
        }
      }
    );
    pathfinder.calculate();
  }
}
```

**Integration Points**:
- Hook into existing `NPCBehaviorManager.update()`
- Use existing pathfinding system from `npc-pathfinding.js`
- Coordinate with LOS system from `npc-los.js`

#### 4.2 LOS Configuration for Hostile NPCs

**File**: `/js/systems/npc-los.js` (MODIFY)

Extend LOS to support hostile tracking:

**Changes Required**:

1. Add method to dynamically enable LOS:
```javascript
export function enableNPCLOS(npc, range = 400, angle = 360) {
  if (!npc.los) {
    npc.los = {};
  }
  npc.los.enabled = true;
  npc.los.range = range;
  npc.los.angle = angle;
}
```

2. Add tracking mode (360 degree vision when hostile):
```javascript
export function setNPCLOSTracking(npc, isTracking) {
  if (npc.los) {
    npc.los.angle = isTracking ? 360 : 120; // Full vision when tracking
  }
}
```

**Integration**:
- Call when NPC becomes hostile
- Reset when NPC returns to normal state

### Phase 5: Animation System

#### 5.1 Placeholder Punch Animations

**File**: `/js/systems/combat-animations.js` (NEW)

Create placeholder animations using walk animations with tinting:

```javascript
// Functions:
- createPunchAnimation(scene, sprite, direction) - Play walk + red tint
- playPlayerPunchAnimation(scene, player, direction) - Player punch
- playNPCPunchAnimation(scene, npc, direction) - NPC punch
- stopPunchAnimation(sprite) - Clear tint and return to idle
```

**Implementation**:
```javascript
export function playPlayerPunchAnimation(scene, player, direction) {
  return new Promise((resolve) => {
    // Apply red tint
    player.setTint(0xff0000);

    // Play walk animation in facing direction
    const animKey = `walk-${direction}`;
    player.play(animKey);

    // After animation duration, clear and resolve
    scene.time.delayedCall(COMBAT_CONFIG.player.punchAnimationDuration, () => {
      player.clearTint();
      player.play(`idle-${direction}`);
      resolve();
    });
  });
}
```

**Integration**:
- Call from player combat system
- Call from NPC combat system
- Use existing animation keys from player and NPC sprite setups

#### 5.2 KO Sprite Replacement

**File**: `/js/systems/npc-ko-sprites.js` (NEW)

Handle NPC knockout visual changes:

```javascript
// Functions:
- createKOSprite(scene, npc) - Replace with KO placeholder
- removeNPCSprite(npc) - Remove active sprite
- createPlaceholderSprite(scene, x, y) - Gray tinted sprite or simple graphic
```

**Implementation**:
```javascript
export function replaceWithKOSprite(scene, npc) {
  const x = npc.sprite.x;
  const y = npc.sprite.y;

  // Remove existing sprite
  npc.sprite.destroy();

  // Create placeholder (e.g., same sprite grayed out and lying down)
  const koSprite = scene.add.sprite(x, y, npc.spriteSheet);
  koSprite.setTint(0x666666); // Gray tint
  koSprite.setAlpha(0.5);
  koSprite.angle = 90; // Rotated to appear "fallen"

  npc.sprite = koSprite;
  npc.isKO = true;

  // Disable collisions and interactions
  if (npc.sprite.body) {
    npc.sprite.body.enable = false;
  }
}
```

**Integration**:
- Call when NPC HP reaches 0
- Remove health bar
- Disable behavior updates for this NPC

### Phase 6: Ink Integration

#### 6.1 Hostile Tag Handler

**File**: `/js/minigames/helpers/chat-helpers.js` (MODIFY)

Add hostile tag processing to existing `processGameActionTags()`:

**Changes Required**:

1. Add new tag pattern to process:
```javascript
// In processGameActionTags()
export function processGameActionTags(tags, ui) {
  // ... existing code ...

  // Add hostile tag processing
  const hostileTags = tags.filter(tag => tag.startsWith('hostile:'));
  for (const tag of hostileTags) {
    processHostileTag(tag, ui);
  }
}
```

2. Implement `processHostileTag()`:
```javascript
function processHostileTag(tag, ui) {
  // Tag format: #hostile:npcId or just #hostile for current NPC
  const parts = tag.split(':');
  const npcId = parts[1] || ui.npcId; // Current NPC if not specified

  console.log(`Processing hostile tag for NPC: ${npcId}`);

  // Set NPC to hostile state
  if (window.npcHostileSystem) {
    window.npcHostileSystem.setNPCHostile(npcId, true);

    // Fire event for game systems to react
    if (window.eventDispatcher) {
      window.eventDispatcher.emit('npc_became_hostile', { npcId });
    }
  }

  // Exit conversation immediately when hostile is triggered
  if (ui.exitConversation) {
    ui.exitConversation();
  }
}
```

**Integration**:
- Works with existing tag processing flow
- Called during Ink tag processing in person-chat minigame
- Automatically exits conversation after setting hostile

#### 6.2 Update Security Guard Ink

**File**: `/scenarios/ink/security-guard.ink` (MODIFY)

Refactor to use proper hub pattern with #exit_conversation and add hostile triggers:

**Key Changes**:

1. Fix hub returns - all paths should return to hub or use #exit_conversation
2. Add hostile trigger for aggressive paths
3. Use #exit_conversation consistently

**Example Implementation**:

```ink
=== hostile_response ===
# speaker:security_guard
~ influence -= 30
That's it. You just made a big mistake.
SECURITY! CODE VIOLATION IN THE CORRIDOR!
# display:guard-aggressive
# hostile:security_guard
# exit_conversation
-> END

=== escalate_conflict ===
# speaker:security_guard
~ influence -= 40
You've crossed the line! This is a lockdown!
INTRUDER ALERT! INTRUDER ALERT!
# display:guard-alarm
# hostile:security_guard
# exit_conversation
-> END
```

**Specific Changes**:
- Lines 83, 99, 119, 134, 150, 159, 167, 180: Replace `-> END` with either `-> hub` or `# exit_conversation` + `-> END`
- Lines 159, 167: Add `# hostile:security_guard` tag before exit
- Ensure hub pattern works: all choices return to hub unless explicitly exiting

### Phase 7: Player Control Modifications

#### 7.1 Disable Movement When KO

**File**: `/js/core/player.js` (MODIFY)

Modify player movement to check KO state:

**Changes Required**:

1. Add KO check in movement update:
```javascript
export function updatePlayerMovement() {
  // Check if player is KO
  if (window.playerHealth?.isPlayerKO()) {
    // Stop all movement
    if (window.player.body) {
      window.player.body.setVelocity(0, 0);
    }
    // Stop animations
    const currentAnim = window.player.anims.currentAnim;
    if (currentAnim && !currentAnim.key.includes('idle')) {
      window.player.play('idle-down');
    }
    return; // Skip movement updates
  }

  // ... existing movement code ...
}
```

2. Add KO check in click-to-move:
```javascript
export function movePlayerToPoint(targetX, targetY) {
  if (window.playerHealth?.isPlayerKO()) {
    console.log('Player is KO, cannot move');
    return;
  }

  // ... existing code ...
}
```

**Integration**:
- Existing movement code remains unchanged except for KO checks
- Works with both click-to-move and keyboard controls

#### 7.2 Punch Interaction

**File**: `/js/systems/interactions.js` (MODIFY)

Add punch interaction for hostile NPCs:

**Changes Required**:

1. Detect hostile NPCs in range:
```javascript
// Add to checkObjectInteractions() or create new function
function checkHostileNPCInteractions() {
  if (!window.player || window.playerHealth?.isPlayerKO()) return;

  const playerPos = { x: window.player.x, y: window.player.y };
  const currentRoomNPCs = getNPCsInRoom(window.currentRoom);

  for (const npc of currentRoomNPCs) {
    if (window.npcHostileSystem?.isNPCHostile(npc.id) &&
        !window.npcHostileSystem?.isNPCKO(npc.id)) {

      const distance = Phaser.Math.Distance.Between(
        playerPos.x, playerPos.y,
        npc.sprite.x, npc.sprite.y
      );

      if (distance <= COMBAT_CONFIG.player.punchRange) {
        // Show punch indicator (could be visual cue)
        showPunchIndicator(npc);

        // Store reference for punch action
        window.currentPunchTarget = npc;
        return;
      }
    }
  }

  window.currentPunchTarget = null;
}
```

2. Add punch key handler:
```javascript
// In input setup (main.js or player.js)
scene.input.keyboard.on('keydown-SPACE', () => {
  if (window.currentPunchTarget && window.playerCombat?.canPlayerPunch()) {
    window.playerCombat.playerPunch(window.currentPunchTarget);
  }
});
```

**Integration**:
- Call `checkHostileNPCInteractions()` in game update loop
- Add visual indicator when punch is available
- Use existing interaction range logic patterns

### Phase 8: Integration and Initialization

#### 8.1 Main Game Initialization

**File**: `/js/main.js` (MODIFY)

Initialize all new systems:

**Changes Required**:

Add initialization in create() method:

```javascript
// In create() after existing initializations
import { initPlayerHealth } from './systems/player-health.js';
import { initPlayerHealthUI } from './systems/player-health-ui.js';
import { initNPCHostileSystem } from './systems/npc-hostile.js';
import { initNPCHealthUI } from './systems/npc-health-ui.js';
import { initGameOverUI } from './systems/game-over-ui.js';
import { initPlayerCombat } from './systems/player-combat.js';
import { initNPCCombat } from './systems/npc-combat.js';

// Initialize health systems
window.playerHealth = initPlayerHealth();
initPlayerHealthUI();

// Initialize hostile system
window.npcHostileSystem = initNPCHostileSystem();
initNPCHealthUI(this);

// Initialize combat systems
window.playerCombat = initPlayerCombat();
window.npcCombat = initNPCCombat();

// Initialize game over UI
initGameOverUI();

// Set up event listeners
window.eventDispatcher.on('player_hp_changed', () => {
  window.playerHealthUI?.update();
});

window.eventDispatcher.on('player_ko', () => {
  window.gameOverUI?.show();
});

window.eventDispatcher.on('npc_became_hostile', ({ npcId }) => {
  // Enable LOS, show health bar, etc.
  const npc = window.npcManager.getNPC(npcId);
  if (npc) {
    enableNPCLOS(npc);
    window.npcHealthUI?.createHealthBar(npcId, npc);
  }
});
```

#### 8.2 Update Loop Integration

**File**: `/js/main.js` or `/js/core/game.js` (MODIFY)

Add combat and health bar updates to game loop:

**Changes Required**:

```javascript
// In update(time, delta) method
update(time, delta) {
  // ... existing updates ...

  // Update combat systems
  if (window.playerCombat) {
    window.playerCombat.update(delta);
  }

  if (window.npcCombat) {
    window.npcCombat.update(delta);
  }

  // Update NPC health bars (position them above sprites)
  if (window.npcHealthUI) {
    window.npcHealthUI.updatePositions();
  }

  // Check for hostile NPC interactions
  checkHostileNPCInteractions();
}
```

### Phase 9: Testing and Configuration

#### 9.1 Testing Checklist

Create test scenarios to verify:

1. **Player Health System**
   - [ ] HP starts at 100
   - [ ] Hearts display correctly when damaged
   - [ ] Hearts hidden at full HP
   - [ ] Half hearts display at odd HP values (10, 30, 50, 70, 90)
   - [ ] Player becomes KO at 0 HP
   - [ ] Game over screen displays at KO

2. **NPC Hostile State**
   - [ ] NPC can be set hostile via Ink tag
   - [ ] Hostile tag exits conversation immediately
   - [ ] LOS enables when hostile
   - [ ] NPC chases player when in LOS
   - [ ] NPC health bar appears when hostile
   - [ ] Health bar updates when damaged
   - [ ] NPC becomes KO at 0 HP
   - [ ] KO sprite appears when NPC KO

3. **Player Combat**
   - [ ] Punch key works near hostile NPC
   - [ ] Punch animation plays
   - [ ] Damage applies if in range
   - [ ] Cooldown prevents spam
   - [ ] Cannot punch when not near hostile NPC
   - [ ] Cannot punch when player is KO

4. **NPC Combat**
   - [ ] NPC attacks when player in range
   - [ ] Attack animation plays
   - [ ] Player takes damage
   - [ ] Attack cooldown works
   - [ ] NPC stops moving to attack
   - [ ] NPC resumes chase after attack

5. **Ink Integration**
   - [ ] #hostile tag triggers hostile state
   - [ ] #exit_conversation works
   - [ ] Security guard ink uses hub pattern correctly
   - [ ] Hostile paths trigger combat mode

6. **Visual Feedback**
   - [ ] Red tint on punch animations
   - [ ] Health bars positioned correctly
   - [ ] Hearts display in correct position
   - [ ] KO sprite appears grayed and rotated
   - [ ] Game over overlay displays correctly

#### 9.2 Configuration Tuning

Values to adjust based on playtesting:

- Player HP: 100 (default)
- Player punch damage: 10-30 range
- Player punch range: 50-80 pixels
- NPC HP: 50-150 range
- NPC punch damage: 5-20 range
- NPC attack range: 40-60 pixels
- Chase speed: 100-150 pixels/second
- Attack cooldowns: 1000-3000ms

### Phase 10: File Dependency Order

Implementation order to minimize integration issues:

1. **Core Systems (No Dependencies)**
   - `/js/config/combat-config.js`
   - `/js/systems/player-health.js`
   - `/js/systems/npc-hostile.js`

2. **UI Components (Depend on Core)**
   - `/js/systems/player-health-ui.js`
   - `/js/systems/npc-health-ui.js`
   - `/js/systems/game-over-ui.js`

3. **Animation Systems**
   - `/js/systems/combat-animations.js`
   - `/js/systems/npc-ko-sprites.js`

4. **Combat Mechanics (Depend on Core + Animation)**
   - `/js/systems/player-combat.js`
   - `/js/systems/npc-combat.js`

5. **Behavior Extensions (Depend on Combat + LOS)**
   - Modify `/js/systems/npc-behavior.js`
   - Modify `/js/systems/npc-los.js`

6. **Integration Points**
   - Modify `/js/systems/interactions.js`
   - Modify `/js/core/player.js`
   - Modify `/js/minigames/helpers/chat-helpers.js`

7. **Main Integration**
   - Modify `/js/main.js`

8. **Content Updates**
   - Modify `/scenarios/ink/security-guard.ink`

## Event Flow Diagrams

### Player Takes Damage Flow
```
NPC Attack Triggered
    ↓
npcCombat.npcAttack(npcId, npc)
    ↓
Check player in range
    ↓
playerHealth.damagePlayer(amount)
    ↓
Emit 'player_hp_changed' event
    ↓
playerHealthUI.update()
    ↓
Check if HP <= 0
    ↓
playerHealth.setKO(true)
    ↓
Emit 'player_ko' event
    ↓
gameOverUI.show()
    ↓
Disable player movement
```

### NPC Becomes Hostile Flow
```
Ink dialogue reaches hostile path
    ↓
Tag: #hostile:security_guard
    ↓
processHostileTag(tag, ui)
    ↓
npcHostileSystem.setNPCHostile(npcId, true)
    ↓
Emit 'npc_became_hostile' event
    ↓
Enable NPC LOS (full 360°)
    ↓
Create NPC health bar
    ↓
Exit conversation (#exit_conversation)
    ↓
NPC behavior switches to hostile mode
    ↓
NPC chases player when in LOS
    ↓
NPC attacks when in range
```

### Player Punches NPC Flow
```
Player near hostile NPC
    ↓
Press SPACE key
    ↓
playerCombat.canPlayerPunch() → true
    ↓
playerCombat.playerPunch(npc)
    ↓
Play punch animation (walk + red tint)
    ↓
Wait animation duration (500ms)
    ↓
Check if NPC still in range
    ↓
npcHostileSystem.damageNPC(npcId, damage)
    ↓
Update NPC health bar
    ↓
Check if NPC HP <= 0
    ↓
npcHostileSystem.setNPCKO(npcId, true)
    ↓
Emit 'npc_ko' event
    ↓
Replace sprite with KO placeholder
    ↓
Remove health bar
    ↓
Disable NPC behavior
```

## Success Criteria

Implementation is complete when:

1. All new files are created and functional
2. All modified files integrate cleanly
3. Player can take damage and see health hearts
4. Player becomes KO at 0 HP with game over screen
5. NPCs can become hostile via Ink tag
6. Hostile NPCs chase and attack player
7. Player can punch hostile NPCs
8. NPCs become KO and show placeholder sprite
9. Security guard Ink uses proper hub pattern
10. All systems work together without errors
11. Configuration values are tunable
12. Visual feedback is clear and functional

## Next Steps After Implementation

1. Add proper punch animation sprites (replace placeholder)
2. Add sound effects for punches and damage
3. Add particle effects for impacts
4. Implement dodge/block mechanics
5. Add more combat-capable NPCs
6. Create weapons/items that affect combat
7. Add difficulty levels with different damage values
8. Implement combo system for multiple hits
