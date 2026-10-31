# Phase 0: Foundation and Design Decisions

## Purpose

This phase establishes critical design decisions and foundational components before beginning implementation. Completing this phase reduces integration risks and ensures consistent implementation.

## Design Decisions to Make

### Decision 1: Multiple Hostile NPCs Handling

**Question**: How does the player target specific NPCs when multiple are hostile?

**Options**:
- A. Closest hostile NPC is auto-targeted
- B. NPC in player's facing direction
- C. Tab/cycle through nearby hostile NPCs
- D. Click to select target

**Recommendation**: Option A (closest) with visual indicator
- Simplest to implement
- Works with keyboard controls
- Add outline/highlight to show current target
- Add "Target: [NPC Name]" UI element

**Implementation**:
- Add `window.currentCombatTarget` global
- Update each frame to closest hostile NPC in punch range
- Visual highlight on targeted NPC

---

### Decision 2: Lost Sight Behavior

**Question**: What happens when hostile NPC loses sight of player?

**Options**:
- A. Return to patrol immediately
- B. Go to last known position, then patrol
- C. Search area for 30 seconds, then patrol
- D. Stay hostile permanently

**Recommendation**: Option C (search then patrol)
- Most realistic
- Gives player escape opportunity
- Creates tension (can they find you?)

**Implementation**:
- Add `lastKnownPlayerPosition` to hostile state
- Add `searchTimeRemaining` counter (30 seconds)
- Add `SEARCHING` state (between HOSTILE and PATROL)
- NPC wanders near last known position during search
- Return to patrol if timeout or player leaves room

---

### Decision 3: Room Transition Behavior

**Question**: What happens when player leaves room with hostile NPC?

**Options**:
- A. NPC follows across rooms
- B. NPC stops at door, stays hostile
- C. NPC resets to normal state
- D. NPC waits at door for 30 seconds, then resets

**Recommendation**: Option D (wait then reset)
- NPCs don't cross room boundaries (standard game design)
- Stays hostile briefly (player can't immediately return)
- Resets eventually (player not locked out forever)

**Implementation**:
- Check if player left room in hostile behavior update
- If yes, NPC moves to door position
- Start 30-second timer
- Play "watching" animation at door
- After timeout, return to patrol and reset hostile state

---

### Decision 4: Conversation Protection

**Question**: Can hostile NPCs attack player during conversations with other NPCs?

**Options**:
- A. Player is invulnerable during conversations
- B. Hostile NPC forces conversation exit
- C. Can be attacked during conversations

**Recommendation**: Option B (forced exit)
- Creates tension
- Realistic (can't chat while under attack)
- Prevents exploit (hide in conversations)

**Implementation**:
- Check if player in conversation in NPC attack logic
- If yes, emit `force_exit_conversation` event
- Conversation UI closes immediately
- Combat continues normally
- Show warning: "Attacked! Conversation interrupted."

---

### Decision 5: Escape Mechanics

**Question**: How can player escape if trapped by hostile NPC?

**Options**:
- A. No escape (player must fight or die)
- B. Push past NPC (collision disabled when running)
- C. Dodge roll through NPC
- D. Multiple exits in combat areas

**Recommendation**: Option B (push past) + Option D (multiple exits)
- Option B: Player holding Shift can push through NPCs (slower)
- Option D: Design rooms with 2+ exits where combat expected

**Implementation**:
- When player holding Sprint key near hostile NPC
- Temporarily disable NPC collision
- Player moves at 50% speed when pushing through
- Re-enable collision after passing
- Mark combat rooms with multiple exits in level design

---

### Decision 6: Hostile State Reversal

**Question**: Can hostile NPCs be calmed down?

**Options**:
- A. Once hostile, always hostile (until KO)
- B. Time-based cooldown (hostile for 60 seconds)
- C. Dialogue option to surrender/apologize
- D. Leave room resets hostile state

**Recommendation**: Option B (time-based) + Option C (dialogue option)
- Option B: After 60 seconds without seeing player, NPC calms
- Option C: Add `#calm:npcId` tag for dialogue de-escalation

**Implementation**:
- Add `hostileTimeElapsed` to hostile state
- Increment when hostile but player not in sight
- Reset to normal state after 60 seconds
- Process `#calm:npcId` tag in chat-helpers.js
- Add calm dialogue options in Ink (requires high influence)

---

### Decision 7: Damage Feedback Intensity

**Question**: How strong should damage feedback be?

**Options**:
- A. Minimal (just health bar update)
- B. Moderate (flash + sound)
- C. Strong (flash + shake + sound + numbers)

**Recommendation**: Option C (strong feedback)
- Critical for game feel
- Players need clear indication of damage
- Can be toggled off in accessibility settings

**Implementation**:
- Screen flash (red overlay, 200ms fade)
- Screen shake (3 pixels, 100ms)
- Player sprite red tint (300ms)
- Damage number float up
- Pain sound effect
- All can be disabled in settings

---

### Decision 8: Attack Telegraphing

**Question**: How much warning before NPC attacks?

**Options**:
- A. No warning (instant attack)
- B. Brief wind-up (250ms)
- C. Clear telegraph (500ms)
- D. Very obvious (1000ms)

**Recommendation**: Option C (500ms telegraph)
- Gives player time to react
- Not so long it's trivial to avoid
- Scales with difficulty (longer on easy, shorter on hard)

**Implementation**:
- Add attack wind-up animation phase
- Flash NPC red during wind-up
- Play grunt sound effect
- Show ! icon above NPC head
- Player has 500ms to dodge/block/retreat

---

### Decision 9: Health Display

**Question**: When should player health hearts be visible?

**Options**:
- A. Always visible
- B. Hidden at full HP, shown when damaged
- C. Semi-transparent at full HP, solid when damaged
- D. Show briefly when entering combat area, hide after

**Recommendation**: Option D (context-aware)
- Clean UI most of the time
- Appears in combat contexts
- Player learns system exists without clutter

**Implementation**:
- Show hearts when:
  - HP < 100
  - Near hostile NPC
  - First 5 seconds in combat-capable area
  - Player takes damage (stays visible)
- Hide hearts when:
  - HP = 100
  - No hostile NPCs nearby
  - Out of combat for 30 seconds

---

### Decision 10: Game Over Options

**Question**: What options on game over screen?

**Options**:
- A. Restart only
- B. Restart or load save
- C. Restart, load save, or main menu
- D. All above plus quit game

**Recommendation**: Option C (restart, load, menu)
- Gives player choices
- Respects player's time
- Standard for most games

**Implementation**:
- Game over screen shows:
  - Restart current room
  - Load last save (if save system exists)
  - Return to main menu
  - Stats (optional): time survived, damage dealt
- Check if save system exists before showing load option

---

## Foundation Components

### Component 1: Event Constants

**File**: `/js/events/combat-events.js` (NEW)

Create centralized event definitions to prevent typos and enable refactoring:

```javascript
export const CombatEvents = {
  // Player events
  PLAYER_HP_CHANGED: 'player_hp_changed',
  PLAYER_KO: 'player_ko',
  PLAYER_DAMAGED: 'player_damaged',
  PLAYER_HEALED: 'player_healed',

  // NPC events
  NPC_HOSTILE_CHANGED: 'npc_hostile_state_changed',
  NPC_BECAME_HOSTILE: 'npc_became_hostile',
  NPC_BECAME_CALM: 'npc_became_calm',
  NPC_KO: 'npc_ko',
  NPC_DAMAGED: 'npc_damaged',

  // Combat events
  PLAYER_ATTACK: 'player_attack',
  NPC_ATTACK: 'npc_attack',
  ATTACK_HIT: 'attack_hit',
  ATTACK_MISS: 'attack_miss',

  // UI events
  FORCE_EXIT_CONVERSATION: 'force_exit_conversation',
  SHOW_DAMAGE_NUMBER: 'show_damage_number'
};

// Event payload types (JSDoc)

/**
 * @typedef {Object} PlayerHPChangedPayload
 * @property {number} hp - Current HP
 * @property {number} maxHP - Maximum HP
 * @property {number} delta - Change amount (negative for damage)
 */

/**
 * @typedef {Object} NPCBecameHostilePayload
 * @property {string} npcId - NPC identifier
 * @property {string} reason - Why NPC became hostile
 */

/**
 * @typedef {Object} AttackHitPayload
 * @property {string} attacker - Attacker ID or 'player'
 * @property {string} target - Target ID or 'player'
 * @property {number} damage - Damage dealt
 * @property {boolean} isCritical - Was it a critical hit
 */
```

---

### Component 2: Test Ink File

**File**: `/scenarios/ink/test-hostile.ink` (NEW)

Create a simple test file to verify hostile tag system before modifying security guard:

```ink
// test-hostile.ink
// Simple test for hostile tag system

VAR test_count = 0

=== start ===
# speaker:test_npc
~ test_count += 1
Welcome to the hostile tag test.

+ [Test hostile tag]
    -> test_hostile
+ [Test exit conversation]
    -> test_exit
+ [Loop back]
    -> start

=== test_hostile ===
# speaker:test_npc
This will trigger hostile mode!
# hostile:security_guard
# exit_conversation
You should now be in combat.
-> END

=== test_exit ===
# speaker:test_npc
This will exit cleanly.
# exit_conversation
Goodbye!
-> END
```

Add test NPC to scenario:
```json
{
  "id": "test_npc",
  "displayName": "Test Dummy",
  "npcType": "person",
  "spriteSheet": "hacker",
  "storyPath": "scenarios/ink/test-hostile.json",
  "currentKnot": "start",
  "position": { "x": 100, "y": 100 },
  "roomId": "test_room"
}
```

**Test Procedure**:
1. Load test NPC conversation
2. Choose "Test hostile tag"
3. Verify:
   - Hostile tag processed
   - Security guard becomes hostile
   - Conversation exits
   - No console errors
4. If successful, proceed to refactor security guard

---

### Component 3: Error Handling Utilities

**File**: `/js/utils/error-handling.js` (NEW)

Create reusable error handling patterns:

```javascript
/**
 * Validate that a system is initialized
 */
export function requireSystem(system, systemName) {
  if (!system) {
    console.error(`${systemName} not initialized`);
    return false;
  }
  return true;
}

/**
 * Validate function parameters
 */
export function validateParams(params, paramName) {
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      console.error(`Invalid parameter ${paramName}.${name}:`, value);
      return false;
    }
  }
  return true;
}

/**
 * Safe function execution with error logging
 */
export function safeExecute(fn, context, ...args) {
  try {
    return fn.apply(context, args);
  } catch (error) {
    console.error(`Error in ${fn.name}:`, error);
    return null;
  }
}

/**
 * Clamp value to range
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Check if NPC exists
 */
export function npcExists(npcId) {
  const npc = window.npcManager?.getNPC(npcId);
  if (!npc) {
    console.warn(`NPC ${npcId} not found`);
    return false;
  }
  return true;
}
```

Usage in all modules:
```javascript
import { requireSystem, validateParams, clamp } from '../utils/error-handling.js';

export function damagePlayer(amount) {
  if (!requireSystem(window.playerHealth, 'Player Health')) return false;
  if (!validateParams({ amount }, 'damagePlayer')) return false;

  amount = clamp(amount, 0, 1000); // Sanity check

  // ... actual logic ...
}
```

---

### Component 4: Debug Console Commands

**File**: `/js/utils/combat-debug.js` (NEW)

Create debugging utilities accessible from console:

```javascript
export const CombatDebug = {
  enabled: true, // Set false in production

  // Player commands
  setPlayerHP(hp) {
    window.playerHealth?.setPlayerHP(hp);
    console.log(`Player HP set to ${hp}`);
  },

  damagePlayer(amount) {
    window.playerHealth?.damagePlayer(amount);
    console.log(`Player damaged for ${amount}`);
  },

  healPlayer(amount) {
    window.playerHealth?.healPlayer(amount);
    console.log(`Player healed for ${amount}`);
  },

  // NPC commands
  makeHostile(npcId) {
    window.npcHostileSystem?.setNPCHostile(npcId, true);
    console.log(`${npcId} is now hostile`);
  },

  makeCalm(npcId) {
    window.npcHostileSystem?.setNPCHostile(npcId, false);
    console.log(`${npcId} is now calm`);
  },

  damageNPC(npcId, amount) {
    window.npcHostileSystem?.damageNPC(npcId, amount);
    console.log(`${npcId} damaged for ${amount}`);
  },

  koNPC(npcId) {
    window.npcHostileSystem?.damageNPC(npcId, 9999);
    console.log(`${npcId} knocked out`);
  },

  // Info commands
  inspectPlayer() {
    const hp = window.playerHealth?.getPlayerHP();
    const ko = window.playerHealth?.isPlayerKO();
    console.table({
      'HP': hp,
      'KO': ko,
      'Position': window.player ? `(${window.player.x}, ${window.player.y})` : 'N/A'
    });
  },

  inspectNPC(npcId) {
    const state = window.npcHostileSystem?.getNPCHostileState(npcId);
    const npc = window.npcManager?.getNPC(npcId);
    console.table({
      'NPC ID': npcId,
      'Hostile': state?.isHostile,
      'HP': `${state?.currentHP}/${state?.maxHP}`,
      'KO': state?.isKO,
      'Position': npc?.sprite ? `(${npc.sprite.x}, ${npc.sprite.y})` : 'N/A'
    });
  },

  listHostileNPCs() {
    const hostile = [];
    // Would need to iterate hostile state map
    console.log('Hostile NPCs:', hostile);
  },

  // Test scenarios
  testDamageSequence() {
    console.log('Testing damage sequence...');
    setTimeout(() => this.damagePlayer(20), 1000);
    setTimeout(() => this.damagePlayer(30), 2000);
    setTimeout(() => this.damagePlayer(40), 3000);
    setTimeout(() => this.damagePlayer(10), 4000);
    console.log('Will take damage over 4 seconds');
  },

  testCombat(npcId = 'security_guard') {
    console.log(`Testing combat with ${npcId}...`);
    this.makeHostile(npcId);
    console.log('NPC is now hostile. Engage in combat!');
  }
};

// Add to window for console access
if (typeof window !== 'undefined') {
  window.CombatDebug = CombatDebug;
}
```

Usage in browser console:
```javascript
CombatDebug.setPlayerHP(50)
CombatDebug.inspectPlayer()
CombatDebug.makeHostile('security_guard')
CombatDebug.inspectNPC('security_guard')
CombatDebug.testDamageSequence()
```

---

### Component 5: Configuration Validation

**File**: `/js/config/combat-config.js` (UPDATE)

Add validation to configuration:

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
    attackWindupDuration: 500, // NEW: Telegraph time
    chaseSpeed: 120,
    chaseRange: 400,
    attackStopDistance: 45,
    searchDuration: 30000, // NEW: Search time when lost sight
    calmDownDuration: 60000 // NEW: Time to calm if not seeing player
  },
  ui: {
    maxHearts: 5,
    healthBarWidth: 60,
    healthBarHeight: 6,
    healthBarOffsetY: -40,
    damageNumberDuration: 1000, // NEW: Damage number float time
    damageNumberRise: 50, // NEW: How high damage numbers float
    screenFlashDuration: 200, // NEW: Damage flash duration
    screenShakeIntensity: 3 // NEW: Screen shake pixels
  },
  feedback: {
    // NEW: Damage feedback settings
    enableScreenFlash: true,
    enableScreenShake: true,
    enableDamageNumbers: true,
    enableSounds: true
  },

  // Validation function
  validate() {
    const errors = [];
    const warnings = [];

    // HP values
    if (this.player.maxHP <= 0) {
      errors.push('Player max HP must be positive');
    }
    if (this.npc.defaultMaxHP <= 0) {
      errors.push('NPC max HP must be positive');
    }

    // Range relationships
    if (this.player.punchRange > this.npc.chaseRange) {
      warnings.push('Player punch range exceeds NPC chase range');
    }
    if (this.npc.attackStopDistance > this.npc.defaultPunchRange) {
      errors.push('Attack stop distance must be ≤ punch range');
    }

    // Timing values
    if (this.player.punchCooldown < 100) {
      warnings.push('Player punch cooldown very short (<100ms)');
    }
    if (this.npc.attackWindupDuration < 200) {
      warnings.push('NPC attack windup very short, may be unfair');
    }

    // Hearts display
    const hpPerHeart = this.player.maxHP / this.ui.maxHearts;
    if (hpPerHeart % 1 !== 0) {
      warnings.push(`HP per heart (${hpPerHeart}) not whole number, may cause display issues`);
    }

    // Log results
    if (errors.length > 0) {
      console.error('❌ Combat config validation FAILED:');
      errors.forEach(e => console.error('  •', e));
    }
    if (warnings.length > 0) {
      console.warn('⚠️  Combat config warnings:');
      warnings.forEach(w => console.warn('  •', w));
    }
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ Combat config validated successfully');
    }

    return errors.length === 0;
  }
};
```

Call validation on load:
```javascript
// In main.js initialization
if (!COMBAT_CONFIG.validate()) {
  console.error('Combat configuration invalid, combat may not work correctly');
}
```

---

## Phase 0 Checklist

Complete these before starting Phase 1:

- [ ] Make all design decisions (10 decisions above)
- [ ] Create event constants file
- [ ] Create test Ink file and test NPC
- [ ] Create error handling utilities
- [ ] Create debug console commands
- [ ] Add configuration validation
- [ ] Document decisions in this file
- [ ] Test event system works
- [ ] Test debug commands work
- [ ] Verify configuration validates

**Estimated Time**: 3-4 hours

**Output**: Foundation components and design decisions ready for implementation

---

## Benefits of Phase 0

1. **Reduced Integration Issues**: Design decisions made upfront prevent conflicts later
2. **Better Error Handling**: Utilities in place from the start
3. **Easier Debugging**: Debug commands available throughout development
4. **Consistent Events**: No event name typos or mismatches
5. **Validated Config**: Configuration errors caught early
6. **Test Infrastructure**: Can test hostile system before modifying real content

By completing Phase 0 first, the subsequent phases will proceed more smoothly with fewer surprises and rework.
