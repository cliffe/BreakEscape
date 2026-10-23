# Quick Start Guide - Hostile NPC Implementation

## Before You Begin

Read these documents in order:
1. ✅ **CORRECTIONS.md** - Critical Ink pattern fixes
2. ✅ **FORMAT_REVIEW.md** - JSON and Ink format validation
3. ✅ **review2/integration_review.md** - Integration points and issues
4. ✅ This document - Quick start guide

---

## Critical Prerequisites (Must Complete First)

### 1. Add Hostile Tag Handler

**File**: `/js/minigames/helpers/chat-helpers.js`

**Location**: In the `processGameActionTags()` function, add this case to the switch statement (around line 60):

```javascript
case 'hostile': {
    const npcId = param || window.currentConversationNPCId;

    if (!npcId) {
        result.message = '⚠️ hostile tag missing NPC ID';
        console.warn(result.message);
        break;
    }

    console.log(`🔴 Processing hostile tag for NPC: ${npcId}`);

    // Set NPC to hostile state
    if (window.npcHostileSystem) {
        window.npcHostileSystem.setNPCHostile(npcId, true);
        result.success = true;
        result.message = `⚠️ ${npcId} is now hostile!`;
    } else {
        result.message = '⚠️ Hostile system not initialized';
        console.warn(result.message);
    }

    // Emit event for other systems
    if (window.eventDispatcher) {
        window.eventDispatcher.emit('npc_became_hostile', { npcId });
    }

    break;
}
```

**Note on Exit Conversation**: ✅ The `#exit_conversation` tag is **already handled** in `/js/minigames/person-chat/person-chat-minigame.js` line 537. **No additional handler needed!**

**Test**: Verify with test Ink file before proceeding.

---

### 2. Create Config Directory

```bash
mkdir -p js/config
```

---

### 3. Fix security-guard.ink

**File**: `/scenarios/ink/security-guard.ink`

Replace all 8 instances of `-> END` with appropriate patterns:

**Hostile paths (lines 159, 167)**:
```ink
# hostile:security_guard
# exit_conversation
-> hub
```

**Other paths (lines 83, 99, 119, 134, 150, 180)**:
```ink
# exit_conversation
-> hub
```

**Do NOT** use `-> END` anywhere.

---

## Phase 0: Foundation (Day 1 Morning)

### Create Core Files

```bash
# Create directories
mkdir -p js/config
mkdir -p js/events
mkdir -p js/utils

# Create combat config
touch js/config/combat-config.js

# Create event constants
touch js/events/combat-events.js

# Create utilities
touch js/utils/error-handling.js
touch js/utils/combat-debug.js

# Create test Ink
touch scenarios/ink/test-hostile.ink
```

### 1. Combat Configuration

**File**: `js/config/combat-config.js`

```javascript
export const COMBAT_CONFIG = {
  player: {
    maxHP: 100,
    punchDamage: 20,
    punchRange: 60,
    punchCooldown: 1000,
    punchAnimationDuration: 500
  },
  npc: {
    defaultMaxHP: 100,
    defaultPunchDamage: 10,
    defaultPunchRange: 50,
    defaultAttackCooldown: 2000,
    attackWindupDuration: 500,
    chaseSpeed: 120,
    chaseRange: 400,
    attackStopDistance: 45
  },
  ui: {
    maxHearts: 5,
    healthBarWidth: 60,
    healthBarHeight: 6,
    healthBarOffsetY: -40,
    damageNumberDuration: 1000,
    damageNumberRise: 50
  },
  feedback: {
    enableScreenFlash: true,
    enableScreenShake: true,
    enableDamageNumbers: true,
    enableSounds: true
  },

  validate() {
    console.log('✅ Combat config loaded');
    return true;
  }
};
```

### 2. Event Constants

**File**: `js/events/combat-events.js`

```javascript
export const CombatEvents = {
  PLAYER_HP_CHANGED: 'player_hp_changed',
  PLAYER_KO: 'player_ko',
  NPC_HOSTILE_CHANGED: 'npc_hostile_state_changed',
  NPC_BECAME_HOSTILE: 'npc_became_hostile',
  NPC_KO: 'npc_ko'
};
```

### 3. Test Ink File

**File**: `scenarios/ink/test-hostile.ink`

```ink
// test-hostile.ink - Test hostile tag system

=== start ===
# speaker:test_npc
Welcome to hostile tag test.
-> hub

=== hub ===
+ [Test hostile tag]
    -> test_hostile
+ [Test exit conversation]
    -> test_exit
+ [Back to start]
    -> start

=== test_hostile ===
# speaker:test_npc
Triggering hostile state for security guard!
# hostile:security_guard
# exit_conversation
-> hub

=== test_exit ===
# speaker:test_npc
Exiting cleanly.
# exit_conversation
-> hub
```

**Compile**:
```bash
# If you have inklecate installed
inklecate scenarios/ink/test-hostile.ink -o scenarios/ink/test-hostile.json
```

---

## Phase 1: Core Systems (Day 1 Afternoon)

### Create Health Systems

```bash
mkdir -p js/systems
touch js/systems/player-health.js
touch js/systems/npc-hostile.js
```

### 1. Player Health System

**File**: `js/systems/player-health.js`

```javascript
import { COMBAT_CONFIG } from '../config/combat-config.js';
import { CombatEvents } from '../events/combat-events.js';

let state = null;

function createInitialState() {
  return {
    currentHP: COMBAT_CONFIG.player.maxHP,
    maxHP: COMBAT_CONFIG.player.maxHP,
    isKO: false
  };
}

export function initPlayerHealth() {
  state = createInitialState();
  console.log('✅ Player health system initialized');

  return {
    getHP: () => state.currentHP,
    getMaxHP: () => state.maxHP,
    isKO: () => state.isKO,
    damage: (amount) => damagePlayer(amount),
    heal: (amount) => healPlayer(amount),
    reset: () => { state = createInitialState(); }
  };
}

function damagePlayer(amount) {
  if (!state) {
    console.error('Player health not initialized');
    return false;
  }

  if (typeof amount !== 'number' || amount < 0) {
    console.error('Invalid damage amount:', amount);
    return false;
  }

  const oldHP = state.currentHP;
  state.currentHP = Math.max(0, state.currentHP - amount);

  // Emit HP changed event
  if (window.eventDispatcher) {
    window.eventDispatcher.emit(CombatEvents.PLAYER_HP_CHANGED, {
      hp: state.currentHP,
      maxHP: state.maxHP,
      delta: -amount
    });
  }

  // Check for KO
  if (state.currentHP <= 0 && !state.isKO) {
    state.isKO = true;
    if (window.eventDispatcher) {
      window.eventDispatcher.emit(CombatEvents.PLAYER_KO, {});
    }
  }

  console.log(`Player HP: ${oldHP} → ${state.currentHP}`);
  return true;
}

function healPlayer(amount) {
  if (!state) return false;

  const oldHP = state.currentHP;
  state.currentHP = Math.min(state.maxHP, state.currentHP + amount);

  if (window.eventDispatcher) {
    window.eventDispatcher.emit(CombatEvents.PLAYER_HP_CHANGED, {
      hp: state.currentHP,
      maxHP: state.maxHP,
      delta: amount
    });
  }

  console.log(`Player HP: ${oldHP} → ${state.currentHP}`);
  return true;
}
```

### 2. NPC Hostile System

**File**: `js/systems/npc-hostile.js`

```javascript
import { COMBAT_CONFIG } from '../config/combat-config.js';
import { CombatEvents } from '../events/combat-events.js';

const npcHostileStates = new Map();

function createHostileState(npcId, config = {}) {
  return {
    isHostile: false,
    currentHP: config.maxHP || COMBAT_CONFIG.npc.defaultMaxHP,
    maxHP: config.maxHP || COMBAT_CONFIG.npc.defaultMaxHP,
    isKO: false,
    attackDamage: config.attackDamage || COMBAT_CONFIG.npc.defaultPunchDamage,
    attackRange: config.attackRange || COMBAT_CONFIG.npc.defaultPunchRange,
    attackCooldown: config.attackCooldown || COMBAT_CONFIG.npc.defaultAttackCooldown,
    lastAttackTime: 0
  };
}

export function initNPCHostileSystem() {
  console.log('✅ NPC hostile system initialized');

  return {
    setNPCHostile: (npcId, isHostile) => setNPCHostile(npcId, isHostile),
    isNPCHostile: (npcId) => isNPCHostile(npcId),
    getState: (npcId) => getNPCHostileState(npcId),
    damageNPC: (npcId, amount) => damageNPC(npcId, amount),
    isNPCKO: (npcId) => isNPCKO(npcId)
  };
}

function setNPCHostile(npcId, isHostile) {
  if (!npcId) {
    console.error('setNPCHostile: Invalid NPC ID');
    return false;
  }

  // Get or create state
  let state = npcHostileStates.get(npcId);
  if (!state) {
    state = createHostileState(npcId);
    npcHostileStates.set(npcId, state);
  }

  const wasHostile = state.isHostile;
  state.isHostile = isHostile;

  console.log(`NPC ${npcId} hostile: ${wasHostile} → ${isHostile}`);

  // Emit event if state changed
  if (wasHostile !== isHostile && window.eventDispatcher) {
    window.eventDispatcher.emit(CombatEvents.NPC_HOSTILE_CHANGED, {
      npcId,
      isHostile
    });
  }

  return true;
}

function isNPCHostile(npcId) {
  const state = npcHostileStates.get(npcId);
  return state ? state.isHostile : false;
}

function getNPCHostileState(npcId) {
  let state = npcHostileStates.get(npcId);
  if (!state) {
    state = createHostileState(npcId);
    npcHostileStates.set(npcId, state);
  }
  return state;
}

function damageNPC(npcId, amount) {
  const state = getNPCHostileState(npcId);
  if (!state) return false;

  if (state.isKO) {
    console.log(`NPC ${npcId} already KO`);
    return false;
  }

  const oldHP = state.currentHP;
  state.currentHP = Math.max(0, state.currentHP - amount);

  console.log(`NPC ${npcId} HP: ${oldHP} → ${state.currentHP}`);

  // Check for KO
  if (state.currentHP <= 0) {
    state.isKO = true;
    if (window.eventDispatcher) {
      window.eventDispatcher.emit(CombatEvents.NPC_KO, { npcId });
    }
  }

  return true;
}

function isNPCKO(npcId) {
  const state = npcHostileStates.get(npcId);
  return state ? state.isKO : false;
}
```

---

## Integration into Game (Day 1 Evening)

### Modify game.js

**File**: `/js/core/game.js`

**In create() method** (around line 600, after NPC system initialization):

```javascript
// Import at top of file
import { initPlayerHealth } from './systems/player-health.js';
import { initNPCHostileSystem } from './systems/npc-hostile.js';
import { COMBAT_CONFIG } from './config/combat-config.js';

// In create() method, after npcManager initialization
async create() {
    // ... existing code ...

    // Initialize combat systems
    COMBAT_CONFIG.validate();
    window.playerHealth = initPlayerHealth();
    window.npcHostileSystem = initNPCHostileSystem();

    console.log('✅ Combat systems ready');

    // ... rest of existing code ...
}
```

---

## Testing Phase 0 & 1

### Test in Browser Console

```javascript
// Test player health
CombatDebug = {
    testPlayerHealth() {
        console.log('Testing player health...');
        window.playerHealth.damage(20);
        console.log('HP:', window.playerHealth.getHP());
        window.playerHealth.damage(50);
        console.log('HP:', window.playerHealth.getHP());
        window.playerHealth.heal(30);
        console.log('HP:', window.playerHealth.getHP());
    },

    testNPCHostile() {
        console.log('Testing NPC hostile...');
        window.npcHostileSystem.setNPCHostile('security_guard', true);
        console.log('Is hostile:', window.npcHostileSystem.isNPCHostile('security_guard'));
        window.npcHostileSystem.damageNPC('security_guard', 30);
        const state = window.npcHostileSystem.getState('security_guard');
        console.log('NPC HP:', state.currentHP, '/', state.maxHP);
    }
};

// Run tests
CombatDebug.testPlayerHealth();
CombatDebug.testNPCHostile();
```

### Test Tag Processing

1. Load test scenario with test NPC
2. Talk to test NPC
3. Choose "Test hostile tag"
4. Verify in console:
   - "Processing hostile tag for NPC: security_guard"
   - Event emitted
   - Conversation exits

---

## Next Steps (Day 2+)

Once Phase 0 & 1 are complete and tested:

1. **Day 2**: Phase 2 (Enhanced Feedback) - Damage numbers, screen effects
2. **Day 3**: Phase 3 (UI Components) - Health displays, game over screen
3. **Day 4**: Phase 4-5 (Combat Mechanics) - Player and NPC combat
4. **Day 5**: Phase 6-7 (Behavior & Integration) - Hostile behavior, interactions
5. **Day 6**: Phase 8-9 (Integration & Testing) - Full integration, testing, polish

Follow **implementation_roadmap.md** for detailed phase breakdowns.

---

## Punch Mechanics Design (For Reference)

### How Punching Works

**Initiation** (Interaction-Based):
- Player **clicks** on hostile NPC, OR
- Player presses **'E' key** when near hostile NPC
- Uses existing interaction system

**Animation**:
- Player punch animation plays (walk + red tint, 500ms)
- Animation plays in player's facing direction

**Damage Application** (AOE):
- After animation completes, check ALL hostile NPCs
- Damage applies to NPCs that are:
  1. Within punch range (60 pixels default)
  2. In player's facing direction (90° cone)
  3. Not already KO'd

**Result**:
- Can hit multiple NPCs with one punch if grouped
- Directional attack (can't hit NPCs behind you)
- Miss if target moves out of range during animation

**Implementation Note**: Phase 5 will implement this using existing interaction patterns from interactions.js

---

## Common Issues and Solutions

### Issue: "Player health not initialized"
**Solution**: Make sure initPlayerHealth() is called in game.js create()

### Issue: "hostile tag not working"
**Solution**: Check that tag handler added to chat-helpers.js with correct case statement

### Issue: "Events not firing"
**Solution**: Verify window.eventDispatcher exists (should be created by NPC system)

### Issue: "Ink compilation errors"
**Solution**: Make sure using `-> hub` not `-> END` everywhere

### Issue: "NPC not found"
**Solution**: Verify NPC exists in scenario and npcManager is initialized

### Issue: "exit_conversation not working"
**Solution**: This should already work! Check /js/minigames/person-chat/person-chat-minigame.js line 537

---

## Critical Reminders

1. ✅ **NEVER use `-> END`** in Ink files - always `-> hub`
2. ✅ **Initialize in game.js create()** not main.js
3. ✅ **Use window.eventDispatcher** for all events
4. ✅ **Test each phase** before moving to next
5. ✅ **Follow existing code patterns** for consistency

---

## Success Criteria for Phase 0-1

- [ ] Tag handlers added to chat-helpers.js
- [ ] Combat config created and validates
- [ ] Player health system initializes without errors
- [ ] NPC hostile system initializes without errors
- [ ] Test Ink file compiles
- [ ] Tag processing works in test scenario
- [ ] Events emit correctly
- [ ] Console tests pass
- [ ] No errors in browser console

Once all checked, proceed to Phase 2!

---

## Resources

- **Full Implementation**: See `implementation_roadmap.md`
- **Corrections**: See `CORRECTIONS.md`
- **Format Guide**: See `FORMAT_REVIEW.md`
- **Integration Details**: See `review2/integration_review.md`
