# Technical Review - NPC Hostile State Implementation

## Code Patterns and Best Practices Analysis

### 1. Module Pattern Analysis

#### Current Approach
The plan uses ES6 modules with exported functions and internal state:

```javascript
let playerCurrentHP = PLAYER_MAX_HP;
let isPlayerKO = false;

export function initPlayerHealth() { ... }
export function damagePlayer(amount) { ... }
```

#### Strengths
- Simple and straightforward
- Matches existing codebase patterns
- Easy to understand

#### Concerns
- Module-level state can cause issues with reinitialization
- Hard to reset state for testing
- Global mutable state

#### Recommendation
Keep the pattern but add explicit state management:

```javascript
// Private state
let state = null;

function createInitialState() {
  return {
    currentHP: PLAYER_MAX_HP,
    isKO: false,
    lastDamageTime: 0
  };
}

export function initPlayerHealth() {
  state = createInitialState();
  return {
    getHP: () => state.currentHP,
    damage: (amount) => damagePlayer(amount),
    reset: () => { state = createInitialState(); }
  };
}

// Internal functions use state
function damagePlayer(amount) {
  if (!state) throw new Error('Player health not initialized');
  state.currentHP = Math.max(0, state.currentHP - amount);
  // ...
}
```

Benefits:
- Explicit initialization
- Easy to reset for testing
- Clear state ownership
- Can expose state inspector for debugging

### 2. Event Emitter Pattern

#### Current Approach
Using global event dispatcher:

```javascript
window.eventDispatcher.emit('player_hp_changed', { hp, maxHP });
```

#### Strengths
- Uses existing game infrastructure
- Decouples systems

#### Concerns
- Event names as strings (typo risk)
- No type safety on payloads
- Hard to track event flow

#### Recommendation
Create event constants and typed emitters:

```javascript
// /js/events/combat-events.js
export const CombatEvents = {
  PLAYER_HP_CHANGED: 'player_hp_changed',
  PLAYER_KO: 'player_ko',
  NPC_HOSTILE_CHANGED: 'npc_hostile_state_changed',
  NPC_BECAME_HOSTILE: 'npc_became_hostile',
  NPC_KO: 'npc_ko'
};

// Type documentation
/**
 * @typedef {Object} PlayerHPChangedPayload
 * @property {number} hp - Current HP
 * @property {number} maxHP - Maximum HP
 * @property {number} delta - Change amount
 */

// Helper to emit with validation
export function emitPlayerHPChanged(hp, maxHP, delta) {
  if (typeof hp !== 'number') {
    console.error('Invalid HP value:', hp);
    return;
  }

  const payload = { hp, maxHP, delta };
  window.eventDispatcher?.emit(CombatEvents.PLAYER_HP_CHANGED, payload);
}
```

Benefits:
- No string typos
- Centralized event documentation
- Payload validation
- Easier refactoring (rename once)

### 3. Phaser Integration Patterns

#### Animation Timing Issue

**Current Approach:**
```javascript
// Wait fixed time
scene.time.delayedCall(500, () => {
  // Apply damage
});
```

**Problem**: Doesn't account for animation speed changes, frame drops, or future sprite changes.

**Recommended Approach:**
```javascript
export function playPunchAnimation(sprite, direction) {
  return new Promise((resolve) => {
    // Apply visual effects
    sprite.setTint(0xff0000);

    // Play animation
    const animKey = `walk-${direction}`;
    sprite.play(animKey);

    // Listen for animation completion
    sprite.once('animationcomplete', () => {
      sprite.clearTint();
      sprite.play(`idle-${direction}`);
      resolve();
    });

    // Fallback timeout in case animation doesn't complete
    const timeout = setTimeout(() => {
      console.warn('Animation timeout, forcing completion');
      sprite.clearTint();
      resolve();
    }, 1000); // Safety timeout

    // Clear timeout if animation completes normally
    sprite.once('animationcomplete', () => clearTimeout(timeout));
  });
}

// Usage
async function playerPunch(target) {
  await playPunchAnimation(player, direction);
  // Now apply damage
  if (isInRange(target)) {
    damageNPC(target, damage);
  }
}
```

Benefits:
- Timing based on actual animation
- Handles animation changes automatically
- Safety timeout prevents hanging
- Cleaner async/await flow

#### Graphics Management

**Health Bar Creation:**

```javascript
// BETTER: Create reusable graphics component
class HealthBar {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.width = config.width || 60;
    this.height = config.height || 6;
    this.offsetY = config.offsetY || -40;

    // Create container for layering
    this.container = scene.add.container(0, 0);

    // Background
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x000000, 1);
    this.bg.fillRect(0, 0, this.width, this.height);

    // Border
    this.bg.lineStyle(1, 0xFFFFFF, 1);
    this.bg.strokeRect(0, 0, this.width, this.height);

    // Fill (health)
    this.fill = scene.add.graphics();

    // Add to container
    this.container.add([this.bg, this.fill]);

    this.currentHP = 100;
    this.maxHP = 100;
  }

  update(currentHP, maxHP) {
    this.currentHP = currentHP;
    this.maxHP = maxHP;

    // Redraw fill
    this.fill.clear();

    const percent = currentHP / maxHP;
    const fillWidth = (this.width - 2) * percent; // -2 for border

    // Color based on health
    let color = 0x00FF00; // Green
    if (percent < 0.3) color = 0xFF0000; // Red
    else if (percent < 0.6) color = 0xFFFF00; // Yellow

    this.fill.fillStyle(color, 1);
    this.fill.fillRect(1, 1, fillWidth, this.height - 2);
  }

  setPosition(x, y) {
    this.container.setPosition(x - this.width / 2, y + this.offsetY);
  }

  setVisible(visible) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.container.destroy();
  }
}

// Usage
const healthBar = new HealthBar(scene, { width: 60, height: 6 });
healthBar.update(75, 100);
healthBar.setPosition(npc.x, npc.y);
```

Benefits:
- Encapsulated state and behavior
- Easy to reuse
- Color feedback based on HP
- Clean API
- Proper cleanup

### 4. State Machine Pattern for NPC Behavior

#### Current Approach
Boolean checks and if/else:

```javascript
if (window.npcHostileSystem?.isNPCHostile(npc.id)) {
  updateHostileBehavior(npc, playerPosition, delta);
} else {
  updateNormalBehavior(npc, playerPosition, delta);
}
```

#### Recommended: Simple State Machine

```javascript
// /js/systems/npc-state-machine.js

const NPCState = {
  IDLE: 'idle',
  PATROL: 'patrol',
  HOSTILE: 'hostile',
  ATTACKING: 'attacking',
  KO: 'ko'
};

class NPCStateMachine {
  constructor(npc) {
    this.npc = npc;
    this.currentState = NPCState.PATROL;
    this.previousState = null;
  }

  transition(newState) {
    if (this.currentState === newState) return;

    console.log(`NPC ${this.npc.id}: ${this.currentState} → ${newState}`);

    // Exit current state
    this.onExit(this.currentState);

    this.previousState = this.currentState;
    this.currentState = newState;

    // Enter new state
    this.onEnter(newState);
  }

  onEnter(state) {
    switch (state) {
      case NPCState.HOSTILE:
        enableNPCLOS(this.npc, 400, 360);
        window.npcHealthUI?.createHealthBar(this.npc.id, this.npc);
        break;
      case NPCState.KO:
        replaceWithKOSprite(this.scene, this.npc);
        window.npcHealthUI?.destroyHealthBar(this.npc.id);
        break;
    }
  }

  onExit(state) {
    switch (state) {
      case NPCState.ATTACKING:
        resumeNPCMovement(this.npc);
        break;
    }
  }

  update(delta, playerPosition) {
    switch (this.currentState) {
      case NPCState.PATROL:
        this.updatePatrol(delta);
        break;
      case NPCState.HOSTILE:
        this.updateHostile(delta, playerPosition);
        break;
      case NPCState.ATTACKING:
        this.updateAttacking(delta);
        break;
      case NPCState.KO:
        // No updates needed
        break;
    }
  }

  updateHostile(delta, playerPosition) {
    const inLOS = isInLineOfSight(this.npc, playerPosition, this.npc.los);

    if (!inLOS) {
      // Lost sight, could add search state
      this.transition(NPCState.PATROL);
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.npc.sprite.x, this.npc.sprite.y,
      playerPosition.x, playerPosition.y
    );

    if (distance <= COMBAT_CONFIG.npc.attackRange) {
      this.transition(NPCState.ATTACKING);
    } else {
      moveNPCTowardsTarget(this.npc, playerPosition);
    }
  }

  updateAttacking(delta) {
    if (window.npcCombat?.canNPCAttack(this.npc.id)) {
      window.npcCombat.npcAttack(this.npc.id, this.npc);
      // Return to hostile (chase) after attack
      setTimeout(() => this.transition(NPCState.HOSTILE), 1000);
    }
  }
}

// Usage in behavior system
const npcStateMachines = new Map(); // npcId -> stateMachine

function updateNPCWithStateMachine(npc, playerPosition, delta) {
  let sm = npcStateMachines.get(npc.id);
  if (!sm) {
    sm = new NPCStateMachine(npc);
    npcStateMachines.set(npc.id, sm);
  }

  // Check if should transition to hostile
  if (window.npcHostileSystem?.isNPCHostile(npc.id) &&
      sm.currentState !== NPCState.HOSTILE &&
      sm.currentState !== NPCState.ATTACKING) {
    sm.transition(NPCState.HOSTILE);
  }

  sm.update(delta, playerPosition);
}
```

Benefits:
- Clear state transitions
- Easy to add new states (e.g., SEARCHING, FLEEING)
- Centralized state logic
- Easier debugging (log all transitions)
- Prevents invalid state combinations

### 5. Damage Calculation Pattern

#### Current Approach
Direct HP subtraction:

```javascript
playerHP -= amount;
```

#### Recommended: Calculation Pipeline

```javascript
// /js/systems/damage-calculation.js

/**
 * Calculate final damage with modifiers
 */
export function calculateDamage(baseDamage, attacker, target, context = {}) {
  let damage = baseDamage;

  // Validate inputs
  if (typeof damage !== 'number' || damage < 0) {
    console.error('Invalid base damage:', baseDamage);
    return 0;
  }

  // Apply attacker modifiers
  if (attacker?.damageMultiplier) {
    damage *= attacker.damageMultiplier;
  }

  // Apply target defense (future)
  if (target?.defense) {
    damage = Math.max(1, damage - target.defense); // Min 1 damage
  }

  // Apply critical hits (future)
  if (context.isCritical) {
    damage *= 2;
  }

  // Random variance (optional, ±10%)
  if (context.useVariance) {
    const variance = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    damage *= variance;
  }

  // Round to integer
  damage = Math.floor(damage);

  // Ensure minimum damage
  return Math.max(1, damage);
}

/**
 * Apply damage to target with full pipeline
 */
export function applyDamage(target, baseDamage, attacker, context = {}) {
  const finalDamage = calculateDamage(baseDamage, attacker, target, context);

  // Apply to player
  if (target === 'player') {
    window.playerHealth?.damagePlayer(finalDamage);
  }
  // Apply to NPC
  else {
    window.npcHostileSystem?.damageNPC(target.id, finalDamage);
  }

  // Show damage number
  if (context.showDamageNumber) {
    showFloatingDamageNumber(target, finalDamage, context.isCritical);
  }

  return finalDamage;
}

// Usage
const damage = applyDamage(
  'player',
  COMBAT_CONFIG.npc.defaultPunchDamage,
  npc,
  { showDamageNumber: true, useVariance: true }
);
```

Benefits:
- Extensible (add armor, buffs, debuffs later)
- Consistent damage across all sources
- Easy to add variance and critical hits
- Centralized damage logic
- Easier to balance

### 6. Memory Management

#### Graphics Object Pooling

For frequently created/destroyed objects like damage numbers:

```javascript
class DamageNumberPool {
  constructor(scene, poolSize = 10) {
    this.scene = scene;
    this.pool = [];
    this.active = [];

    // Pre-create pool
    for (let i = 0; i < poolSize; i++) {
      this.pool.push(this.createDamageNumber());
    }
  }

  createDamageNumber() {
    const text = this.scene.add.text(0, 0, '', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    text.setVisible(false);
    return text;
  }

  show(x, y, damage, isCritical = false) {
    // Get from pool or create new
    let text = this.pool.pop();
    if (!text) {
      text = this.createDamageNumber();
    }

    // Configure
    text.setText(damage.toString());
    text.setPosition(x, y);
    text.setVisible(true);
    text.setAlpha(1);
    text.setScale(isCritical ? 1.5 : 1);
    text.setColor(isCritical ? '#ff0000' : '#ffffff');

    this.active.push(text);

    // Animate up and fade out
    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.recycle(text);
      }
    });
  }

  recycle(text) {
    text.setVisible(false);
    const index = this.active.indexOf(text);
    if (index > -1) {
      this.active.splice(index, 1);
    }
    this.pool.push(text);
  }

  destroy() {
    [...this.pool, ...this.active].forEach(text => text.destroy());
    this.pool = [];
    this.active = [];
  }
}

// Usage
const damageNumberPool = new DamageNumberPool(scene, 20);
damageNumberPool.show(npc.x, npc.y, 15, false);
```

Benefits:
- Reduces garbage collection
- Better performance
- Smooth animations
- Handles critical hits

### 7. Null Safety and Defensive Programming

Add throughout all modules:

```javascript
export function damageNPC(npcId, amount) {
  // Validate NPC ID
  if (!npcId) {
    console.error('damageNPC: Invalid NPC ID');
    return false;
  }

  // Check hostile system exists
  if (!window.npcHostileSystem) {
    console.error('damageNPC: Hostile system not initialized');
    return false;
  }

  // Get hostile state
  const state = window.npcHostileSystem.getNPCHostileState(npcId);
  if (!state) {
    console.warn(`damageNPC: No hostile state for NPC ${npcId}, creating...`);
    // Auto-create state? Or return?
    return false;
  }

  // Validate amount
  if (typeof amount !== 'number' || amount < 0) {
    console.error('damageNPC: Invalid damage amount:', amount);
    return false;
  }

  // Already KO?
  if (state.isKO) {
    console.log(`damageNPC: NPC ${npcId} already KO`);
    return false;
  }

  // Apply damage
  try {
    state.currentHP = Math.max(0, state.currentHP - amount);

    // Emit event
    window.eventDispatcher?.emit('npc_hp_changed', {
      npcId,
      hp: state.currentHP,
      maxHP: state.maxHP,
      delta: -amount
    });

    // Check KO
    if (state.currentHP <= 0) {
      state.isKO = true;
      window.eventDispatcher?.emit('npc_ko', { npcId });
    }

    return true;
  } catch (error) {
    console.error('damageNPC: Error applying damage:', error);
    return false;
  }
}
```

Pattern to use everywhere:
1. Validate all inputs
2. Check prerequisites (systems initialized)
3. Check state validity
4. Execute with try/catch
5. Return success/failure
6. Log appropriately (errors vs warnings vs info)

### 8. Configuration Validation

```javascript
// /js/config/combat-config.js

export const COMBAT_CONFIG = {
  player: {
    maxHP: 100,
    punchDamage: 20,
    punchRange: 60,
    punchCooldown: 1000
  },
  npc: {
    defaultMaxHP: 100,
    defaultPunchDamage: 10,
    defaultPunchRange: 50,
    defaultAttackCooldown: 2000,
    chaseSpeed: 120,
    chaseRange: 400,
    attackStopDistance: 45
  },
  ui: {
    maxHearts: 5,
    healthBarWidth: 60,
    healthBarHeight: 6,
    healthBarOffsetY: -40
  },

  // Validation
  validate() {
    const errors = [];

    // Check HP values
    if (this.player.maxHP <= 0) {
      errors.push('Player max HP must be positive');
    }

    // Check ranges make sense
    if (this.player.punchRange > this.npc.chaseRange) {
      errors.push('Player punch range should not exceed NPC chase range');
    }

    if (this.npc.attackStopDistance > this.npc.defaultPunchRange) {
      errors.push('Attack stop distance should be ≤ punch range');
    }

    // Check cooldowns
    if (this.player.punchCooldown < 100) {
      errors.push('Player punch cooldown too short (min 100ms)');
    }

    // Hearts calculation
    if (this.player.maxHP % (this.ui.maxHearts * 2) !== 0) {
      console.warn('Player max HP not evenly divisible by hearts for clean display');
    }

    if (errors.length > 0) {
      console.error('Combat config validation errors:');
      errors.forEach(e => console.error('  -', e));
      return false;
    }

    console.log('✓ Combat config valid');
    return true;
  }
};

// Call validation on init
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    COMBAT_CONFIG.validate();
  });
}
```

### 9. Debug Utilities

Add debugging helpers for development:

```javascript
// /js/utils/combat-debug.js

export const CombatDebug = {
  enabled: true, // Set to false in production

  logDamage(source, target, amount, actualDamage) {
    if (!this.enabled) return;
    console.log(`💥 ${source} → ${target}: ${amount} damage (${actualDamage} applied)`);
  },

  logState(entity, state) {
    if (!this.enabled) return;
    console.log(`📊 ${entity}:`, state);
  },

  visualizeHitbox(scene, x, y, range, color = 0x00ff00) {
    if (!this.enabled) return;
    const circle = scene.add.circle(x, y, range, color, 0.2);
    scene.time.delayedCall(500, () => circle.destroy());
  },

  visualizePath(scene, path, color = 0x0000ff) {
    if (!this.enabled) return;
    const graphics = scene.add.graphics();
    graphics.lineStyle(2, color, 0.5);

    for (let i = 0; i < path.length - 1; i++) {
      graphics.lineBetween(
        path[i].x, path[i].y,
        path[i + 1].x, path[i + 1].y
      );
    }

    scene.time.delayedCall(2000, () => graphics.destroy());
  },

  inspectNPC(npcId) {
    const hostile = window.npcHostileSystem?.getNPCHostileState(npcId);
    const npc = window.npcManager?.getNPC(npcId);
    console.table({
      'NPC ID': npcId,
      'Hostile': hostile?.isHostile,
      'HP': `${hostile?.currentHP}/${hostile?.maxHP}`,
      'KO': hostile?.isKO,
      'Position': npc ? `(${npc.sprite?.x}, ${npc.sprite?.y})` : 'N/A'
    });
  },

  inspectPlayer() {
    const hp = window.playerHealth?.getPlayerHP();
    const ko = window.playerHealth?.isPlayerKO();
    const pos = window.player ? `(${window.player.x}, ${window.player.y})` : 'N/A';
    console.table({
      'HP': hp,
      'KO': ko,
      'Position': pos
    });
  }
};

// Add to window for console access
if (typeof window !== 'undefined') {
  window.CombatDebug = CombatDebug;
}
```

Usage in console:
```javascript
CombatDebug.inspectPlayer()
CombatDebug.inspectNPC('security_guard')
CombatDebug.visualizeHitbox(scene, player.x, player.y, 60)
```

## Summary of Technical Recommendations

1. **Use state initialization pattern** - Makes testing and reset easier
2. **Create event constants** - Prevents typos, enables refactoring
3. **Use animation callbacks** - Don't rely on fixed timers
4. **Create reusable UI components** - Health bars, damage numbers
5. **Implement state machine** - Clearer NPC behavior logic
6. **Use damage calculation pipeline** - Extensible for future features
7. **Add object pooling** - Better performance for frequent creates/destroys
8. **Defensive programming everywhere** - Validate inputs, check prerequisites
9. **Validate configuration** - Catch config errors early
10. **Build debug utilities** - Makes development and troubleshooting easier

These patterns will make the code more maintainable, testable, and extensible.
