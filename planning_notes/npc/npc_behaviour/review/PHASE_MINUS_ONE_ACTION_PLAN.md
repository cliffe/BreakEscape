# NPC Behavior Implementation - Phase -1 Action Plan

**Purpose**: Concrete steps to fix critical issues before Phase 1 implementation  
**Estimated Time**: 1 day (revised from 2-3 days)  
**Required Before**: Any Phase 1 work begins  

---

## 🎯 Overview (Updated)

This document provides **exact code changes** needed to fix the 3 remaining critical issues discovered in the comprehensive review.

**GOOD NEWS**: After consultation with the codebase maintainer, we confirmed:
- ✅ Rooms **never unload** - No lifecycle management needed!
- ✅ `immovable: true` is correct - Same as player, doesn't break collision
- ✅ No depth caching needed - Update every frame is fine
- ✅ No state persistence needed - NPCs persist naturally

**Remaining Fixes**:
1. Walk animations (4 directions)
2. Player position tracking
3. Phone NPC filtering

---

## 🔧 Fix #1: Walk Animations Must Be Created During Sprite Setup (CRITICAL)

**Issue**: Only idle animations exist, walk animations needed for patrol/movement behaviors  
**Severity**: 🔴 CRITICAL - Patrolling NPCs will appear to slide  
**Files to Modify**: 
- `js/systems/npc-sprites.js`

**GOOD NEWS**: Room lifecycle simplified! Rooms never unload, so no lifecycle management needed.

### Implementation

**Location**: `js/systems/npc-sprites.js`, function `setupNPCAnimations`

**Current Code** (lines ~200-250):
```javascript
function setupNPCAnimations(scene, sprite, npcData) {
  const { npcType, appearance } = npcData;
  
  // Only idle animations currently created
  const idleKey = `${appearance.body}_${appearance.hair}_idle_down`;
  // ... etc
}
```

**Add Walk Animations**:
```javascript
function setupNPCAnimations(scene, sprite, npcData) {
  const { appearance } = npcData;
  const body = appearance.body;
  const hair = appearance.hair;
  const outfit = appearance.outfit;
  
  // Animation naming convention: {body}_{hair}_{state}_{direction}
  const directions = ['down', 'up', 'left', 'right'];
  
  // 1. Create IDLE animations (existing)
  directions.forEach(dir => {
    const idleKey = `${body}_${hair}_idle_${dir}`;
    
    if (!scene.anims.exists(idleKey)) {
      scene.anims.create({
        key: idleKey,
        frames: scene.anims.generateFrameNumbers(body, {
          start: getIdleFrameForDirection(dir),
          end: getIdleFrameForDirection(dir)
        }),
        frameRate: 1,
        repeat: -1
      });
    }
  });
  
  // 2. Create WALK animations (NEW - CRITICAL FIX)
  directions.forEach(dir => {
    const walkKey = `${body}_${hair}_walk_${dir}`;
    
    if (!scene.anims.exists(walkKey)) {
      scene.anims.create({
        key: walkKey,
        frames: scene.anims.generateFrameNumbers(body, {
          start: getWalkFrameStartForDirection(dir),
          end: getWalkFrameEndForDirection(dir)
        }),
        frameRate: 8,  // 8 FPS for walk animation
        repeat: -1
      });
    }
  });
  
  // Set initial animation (idle down)
  sprite.play(`${body}_${hair}_idle_down`);
  
  console.log(`✅ Animations created for ${body}_${hair}: idle + walk (4 directions each)`);
}

/**
 * Helper: Get frame index for idle animation
 */
function getIdleFrameForDirection(direction) {
  // Assuming standard spritesheet layout:
  // Row 0: down, Row 1: left, Row 2: right, Row 3: up
  // Idle frame is first frame of each row
  switch (direction) {
    case 'down': return 0;
    case 'left': return 4;
    case 'right': return 8;
    case 'up': return 12;
    default: return 0;
  }
}

/**
 * Helper: Get walk animation frame range
 */
function getWalkFrameStartForDirection(direction) {
  // Walk frames typically start at frame 1 of each row
  switch (direction) {
    case 'down': return 0;
    case 'left': return 4;
    case 'right': return 8;
    case 'up': return 12;
    default: return 0;
  }
}

function getWalkFrameEndForDirection(direction) {
  // Walk frames typically are 3-4 frames per direction
  switch (direction) {
    case 'down': return 3;
    case 'left': return 7;
    case 'right': return 11;
    case 'up': return 15;
    default: return 3;
  }
}
```

**Verification**:
After implementing, check:
```javascript
// In browser console after game loads
const npc = window.npcManager.npcs.get('office_receptionist');
const sprite = npc.sprite;

// Should see both idle and walk animations
console.log(sprite.anims.animationManager.anims.entries);
// Should include: body_hair_idle_down, body_hair_walk_down, etc.
```

---

## 🔧 Fix #2: Player Position Tracking (CRITICAL)

**Issue**: Walk animations don't exist when behavior system needs them  
**Severity**: 🔴 CRITICAL  
**File to Modify**: `js/systems/npc-sprites.js`

### Modify setupNPCAnimations Function

**Location**: `js/systems/npc-sprites.js` around line 127

**Find**: `export function setupNPCAnimations(scene, sprite, spriteSheet, config, npcId)`

**Replace the entire function with**:
```javascript
export function setupNPCAnimations(scene, sprite, spriteSheet, config, npcId) {
  // Create walk animations for all NPCs (even if not moving initially)
  // This ensures animations exist when behavior system needs them
  const walkAnimations = [
    { dir: 'walk-right', frames: [1, 2, 3, 4] },
    { dir: 'walk-down', frames: [6, 7, 8, 9] },
    { dir: 'walk-up', frames: [11, 12, 13, 14] },
    { dir: 'walk-up-right', frames: [16, 17, 18, 19] },
    { dir: 'walk-down-right', frames: [21, 22, 23, 24] }
  ];

  walkAnimations.forEach(({ dir, frames }) => {
    const animKey = `npc-${npcId}-${dir}`;
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(spriteSheet, { frames }),
        frameRate: 8,
        repeat: -1
      });
    }
  });

  // Create idle animations for all 8 directions
  const idleAnimations = [
    { dir: 'idle-right', frame: 0 },
    { dir: 'idle-down', frame: 5 },
    { dir: 'idle-up', frame: 10 },
    { dir: 'idle-up-right', frame: 15 },
    { dir: 'idle-down-right', frame: 20 }
  ];

  idleAnimations.forEach(({ dir, frame }) => {
    const animKey = `npc-${npcId}-${dir}`;
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: [{ key: spriteSheet, frame }],
        frameRate: 1
      });
    }
  });

  // Keep existing greeting/talking animation code
  if (config.greetFrameStart !== undefined && config.greetFrameEnd !== undefined) {
    if (!scene.anims.exists(`npc-${npcId}-greet`)) {
      scene.anims.create({
        key: `npc-${npcId}-greet`,
        frames: scene.anims.generateFrameNumbers(spriteSheet, {
          start: config.greetFrameStart,
          end: config.greetFrameEnd
        }),
        frameRate: 8,
        repeat: 0
      });
    }
  }

  if (config.talkFrameStart !== undefined && config.talkFrameEnd !== undefined) {
    if (!scene.anims.exists(`npc-${npcId}-talk`)) {
      scene.anims.create({
        key: `npc-${npcId}-talk`,
        frames: scene.anims.generateFrameNumbers(spriteSheet, {
          start: config.talkFrameStart,
          end: config.talkFrameEnd
        }),
        frameRate: 6,
        repeat: -1
      });
    }
  }

  console.log(`✅ Animations created for ${npcId} (walk + idle + special)`);
}
```

---

## 🔧 Fix #3: Add Missing setupNPCEnvironmentCollisions Function

**Issue**: Function called but doesn't exist  
**Severity**: 🟡 MAJOR  
**File to Modify**: `js/systems/npc-sprites.js`

### Add New Function

**Location**: `js/systems/npc-sprites.js` (add after `createNPCCollision` function)

**Add**:
```javascript
/**
 * Set up environment collisions for NPC (walls, furniture, etc.)
 * Same collision setup as player gets
 * 
 * @param {Phaser.Scene} scene - Phaser scene instance
 * @param {Phaser.Sprite} sprite - NPC sprite
 * @param {string} roomId - Room ID for collision setup
 */
export function setupNPCEnvironmentCollisions(scene, sprite, roomId) {
  if (!scene || !sprite || !roomId) {
    console.warn('❌ Cannot set up NPC environment collisions: missing parameters');
    return;
  }

  try {
    // Get room data
    const room = window.rooms?.[roomId];
    if (!room) {
      console.warn(`⚠️ Room ${roomId} not found for NPC collision setup`);
      return;
    }

    // Add wall collisions
    if (room.collisionLayer) {
      scene.physics.add.collider(sprite, room.collisionLayer);
      console.log(`✅ Wall collisions set up for ${sprite.npcId}`);
    }

    // Add furniture collisions (chairs, desks, etc.)
    if (window.swivelChairs && Array.isArray(window.swivelChairs)) {
      window.swivelChairs.forEach(chair => {
        if (chair.roomId === roomId) {
          scene.physics.add.collider(sprite, chair);
        }
      });
    }

    // Add collisions with other objects that have physics bodies
    if (room.objects) {
      Object.values(room.objects).forEach(obj => {
        if (obj && obj.body && obj.active) {
          scene.physics.add.collider(sprite, obj);
        }
      });
    }

  } catch (error) {
    console.error(`❌ Error setting up NPC environment collisions for ${sprite.npcId}:`, error);
  }
}
```

---

## 🔧 Fix #4: Add roomId to NPC Data During Initialization

**Issue**: Behavior system needs roomId but it's not stored in NPC data  
**Severity**: 🔴 CRITICAL  
**File to Modify**: `js/core/rooms.js`

### Add roomId During Scenario Initialization

**Location**: `js/core/rooms.js` in `initializeRooms()` function (around line 400-500)

**Find**: Where NPCs are loaded/registered (look for `npcLazyLoader` or `npcManager.registerNPC`)

**Add** roomId assignment:
```javascript
// In initializeRooms() or similar initialization function
export function initializeRooms(game) {
  // ... existing setup ...

  // Process all rooms and assign roomId to NPCs
  for (const [roomId, roomData] of Object.entries(window.gameScenario.rooms)) {
    if (roomData.npcs && Array.isArray(roomData.npcs)) {
      for (const npc of roomData.npcs) {
        // CRITICAL: Store roomId in NPC data
        npc.roomId = roomId;
        console.log(`✅ Assigned roomId "${roomId}" to NPC "${npc.id}"`);
      }
    }
  }

  // ... rest of initialization ...
}
```

---

## 🔧 Fix #5: Filter Phone-Only NPCs Before Behavior Registration

**Issue**: Phone NPCs don't have sprites but might have behavior config  
**Severity**: 🟡 MAJOR  
**File to Modify**: `js/core/rooms.js`

### Add Type Check

**Location**: `js/core/rooms.js` in `createNPCSpritesForRoom()` (already modified in Fix #1)

**Ensure this check exists**:
```javascript
// In createNPCSpritesForRoom() - already added in Fix #1
if (sprite && window.npcBehaviorManager && npc.behavior) {
  // Only register behavior for NPCs with sprites
  if (npc.npcType === 'person' || npc.npcType === 'both' || npc.npcType === 'sprite') {
    window.npcBehaviorManager.registerBehavior(
      npc.id,
      sprite,
      npc.behavior,
      roomId
    );
  } else {
    console.warn(`⚠️ Behavior config ignored for phone-only NPC ${npc.id}`);
  }
}
```

---

## ✅ Testing Phase -1 Fixes (Updated)

### Test 1: Walk Animation Test

**Objective**: Verify all 4-direction walk animations work correctly

**Setup**:
1. Create test scenario with patrolling NPC
2. NPC should have `patrol.enabled: true` in behavior config

**Test Steps**:
1. Load game and observe NPC
2. Watch NPC patrol in different directions
3. **CHECK**: Walk animation plays when moving
4. **CHECK**: Idle animation plays when stopped
5. **CHECK**: Animation changes correctly with direction

**Expected**:
- Smooth walk cycles in all 4 directions
- No "sliding" (walk animation must play)
- Clean transitions between idle and walk

---

### Test 2: Player Position Tracking

**Objective**: Verify behaviors can read player position

**Test Steps**:
1. Add console.log in behavior code:
   ```javascript
   console.log('Player pos:', window.player.x, window.player.y);
   ```
2. Load game
3. Move player around
4. **CHECK**: Console shows updating coordinates

**Expected**:
- `window.player.x` and `window.player.y` are numbers
- Values update as player moves
- No `undefined` or `null` errors

---

### Test 3: Phone NPC Filtering

**Objective**: Verify phone-only NPCs don't crash behavior system

**Setup**:
Create test scenario with mixed NPCs:
```json
{
  "npcs": [
    {
      "id": "physical_npc",
      "npcType": "person",
      "behavior": { "facePlayer": true }
    },
    {
      "id": "phone_npc",
      "npcType": "phone",
      "behavior": { "facePlayer": true }  // Should be ignored
    }
  ]
}
```

**Test Steps**:
1. Load scenario
2. Check console for warnings
3. **CHECK**: Physical NPC works normally
4. **CHECK**: Phone NPC shows warning but doesn't crash
5. **CHECK**: No errors about missing sprites

**Expected**:
- Warning: "Behavior config ignored for phone-only NPC phone_npc"
- No crashes or sprite errors
- Physical NPC behavior works

---

### Test 4: Performance Test (Optional)

**Objective**: Ensure depth updates don't tank performance

**Setup**:
- 10 NPCs with patrol behaviors

**Test Steps**:
1. Open browser dev tools → Performance tab
2. Record 30 seconds of gameplay
3. Check FPS

**Expected**:
- Consistent 60 FPS
- No frame drops during patrol
- Depth updates don't show in performance bottlenecks

---```json
{
  "npcs": [
    {
      "id": "phone_npc",
      "displayName": "Phone Contact",
      "npcType": "phone",
      "phoneId": "player_phone",
      "behavior": {
        "facePlayer": true
      }
    }
  ]
}
```

**Expected**: Warning in console, but no errors. Phone NPC should work normally.

---

### Test 3: Performance Test

**Load**: 10 NPCs with patrol behaviors in one room

**Monitor**:
- FPS (should stay near 60)
- Console for performance warnings
- Smooth NPC movement

**Expected**: <10% FPS drop with 10 patrolling NPCs

---

## 📋 Phase -1 Completion Checklist (Updated)

- [ ] Added walk animations to `setupNPCAnimations()` (4 directions: up, down, left, right)
- [ ] Added idle animations (if not already present)
- [ ] Verified player position accessible via `window.player.x` and `window.player.y`
- [ ] Added NPC type filtering (phone NPCs excluded from behavior system)
- [ ] Created `setupNPCEnvironmentCollisions()` function (if not already present)
- [ ] Tested walk animations display correctly during movement
- [ ] Tested with phone-only NPC (no errors)
- [ ] Tested with 10 patrolling NPCs (good performance)
- [ ] All console errors resolved
- [ ] Code reviewed and approved

**Removed from checklist (not needed)**:
- ~~Lifecycle management~~ - Rooms never unload!
- ~~`registerBehavior()`~~ - Not needed yet (Phase 1)
- ~~`unregisterBehaviorsForRoom()`~~ - Not needed (rooms persist)
- ~~Room transition testing~~ - No unloading to test
- ~~roomId assignment~~ - Already working or not blocking

---

## 🚀 After Phase -1: Next Steps

Once all Phase -1 fixes are complete and tested:

1. ✅ Update all planning documents
2. ✅ Get sign-off on revised plan
3. ✅ Create development branch
4. ✅ Begin Phase 0 (remaining prerequisites)
5. ✅ Begin Phase 1 (core behavior implementation)

**Estimated Timeline** (Revised):
- Phase -1: **1 day** (down from 2-3 days)
- Phase 0: 1 day
- Phase 1-7: 2 weeks

**Total**: **3 weeks** for full implementation (down from 3-4 weeks)

---

**Last Updated**: [Current Date]  
**Status**: Ready for implementation (simplified architecture)  
**Priority**: � IMPORTANT - Recommended before Phase 1 (not blocking)
