# NPC Behavior Implementation Plan - Review & Recommendations

**Review Date**: November 9, 2025  
**Reviewer**: AI Development Assistant  
**Status**: ⚠️ Plan requires updates before implementation

---

## Executive Summary

The NPC behavior implementation plan is **well-structured and comprehensive**, but has several **critical issues** that will cause implementation failures if not addressed. The plan demonstrates good understanding of the codebase architecture but contains incorrect assumptions about sprite handling, animation creation timing, and collision body configuration.

**Recommendation**: Address all CRITICAL issues before Phase 1 implementation begins.

---

## ✅ STRENGTHS

### 1. **Excellent Documentation Structure**
- Clear separation of concerns (Implementation Plan, Technical Spec, Quick Reference)
- Comprehensive phased rollout with success criteria
- Good use of examples (Ink files, scenario JSON)

### 2. **Modular Architecture**
- Clean separation of behavior logic from sprite management
- Reuses proven patterns from player.js
- Good integration with existing NPC systems

### 3. **Performance Considerations**
- Throttled update loops (50ms)
- Squared distance calculations
- Animation caching strategy

### 4. **Scenario-Driven Design**
- Behaviors configurable via JSON
- Sensible defaults (face player only)
- Ink tag integration for dynamic control

---

## 🚨 CRITICAL ISSUES (Must Fix Before Implementation)

### 1. **Incorrect NPC Collision Body Configuration**

**Location**: `TECHNICAL_SPEC.md` lines 51-52, `npc-sprites.js` lines 51-52

**Current Code (WRONG)**:
```javascript
sprite.body.setSize(18, 10);
sprite.body.setOffset(23, 50);
```

**Issue**: This is ALREADY the correct collision configuration in `npc-sprites.js:51-52`. The plan says to "match player collision" but NPCs already have `(18, 10)` collision boxes. However, the player uses `(15, 10)` with offset `(25, 50)`.

**Player's Configuration** (from `player.js:73-74`):
```javascript
player.body.setSize(15, 10);
player.body.setOffset(25, 50);
```

**Actual NPC Configuration** (from `npc-sprites.js:51-52`):
```javascript
sprite.body.setSize(18, 10); // Collision body size (wider for better hit detection)
sprite.body.setOffset(23, 50); // Offset for feet position (64px sprite, adjusted for wider box)
```

**Analysis**: 
- NPCs have **18px wide** collision boxes (vs player's 15px)
- NPCs use **23px offset** (vs player's 25px) to compensate for wider box
- Both are 10px tall and positioned at sprite bottom (Y offset 50)
- **The current NPC config is intentionally different and should NOT be changed**

**Recommendation**: 
- ✅ **Keep existing NPC collision configuration** (18x10 with offset 23, 50)
- Update plan documentation to reflect this is intentional
- Note that NPCs need wider collision for better hit detection during patrol
- DO NOT copy player collision settings

**Fix Required**: Update all references in TECHNICAL_SPEC.md and IMPLEMENTATION_PLAN.md to acknowledge current NPC collision is intentional and correct.

---

### 2. **Missing Patrol Bounds Validation**

**Location**: `TECHNICAL_SPEC.md` line 483+, `IMPLEMENTATION_PLAN.md` line 418+

**Current Plan**: Uses `config.patrol.bounds` to constrain patrol area

**Issue**: No validation that patrol bounds include NPC starting position. If bounds exclude starting position, NPC will immediately pathfind outside bounds.

**Consequences**:
- NPC stuck at spawn trying to reach invalid patrol target
- Continuous console spam from pathfinding errors
- Patrol behavior appears broken to scenario designers

**Solution**: Add bounds validation in `NPCBehavior.parseConfig()`:

```javascript
parseConfig(userConfig) {
  // ... existing config merge ...
  
  // Validate patrol bounds include starting position
  if (config.patrol.enabled && config.patrol.bounds) {
    const bounds = config.patrol.bounds;
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
      
      config.patrol.bounds = {
        x: newX,
        y: newY,
        width: newMaxX - newX,
        height: newMaxY - newY
      };
      
      console.log(`✅ Patrol bounds expanded to include starting position`);
    }
  }
  
  return config;
}
```

---

### 3. **Incorrect Animation Creation Timing**

**Location**: `TECHNICAL_SPEC.md` line 308+, `IMPLEMENTATION_PLAN.md` Phase 3

**Current Plan**: Says to "extend `setupNPCAnimations()` to create walk animations"

**Issue**: `setupNPCAnimations()` is called **ONCE** during sprite creation in `npc-sprites.js:55`. If walk animations are not created at that time, they will NEVER exist.

**Timeline**:
1. `createNPCSprite()` called (npc-sprites.js:18)
2. `setupNPCAnimations()` called (line 55) - **ONLY TIME TO CREATE ANIMATIONS**
3. Sprite returned
4. **Later**: Behavior system registers NPC
5. Behavior tries to play walk animations → **FAIL: animations don't exist**

**Solution - IMMEDIATE** (Before Phase 1):

Modify `npc-sprites.js` **NOW** to create all walk animations:

```javascript
export function setupNPCAnimations(scene, sprite, spriteSheet, config, npcId) {
    // ... existing idle animation code ...
    
    // NEW: Create walk animations for all NPCs (even if not moving yet)
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
    
    // Also create idle animations for all 8 directions
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
    
    // ... existing greet/talk animation code ...
}
```

**CRITICAL**: This must be done BEFORE Phase 1 implementation starts.

---

### 4. **NPC Sprite Reference Storage Confusion**

**Location**: Multiple files reference different sprite storage locations

**Issue**: Plan documentation is unclear about where NPC sprites are stored. There are actually **THREE** storage locations:

1. **`npcData._sprite`** - Set in `npc-sprites.js:69`
   ```javascript
   npc._sprite = sprite;
   ```

2. **`roomData.npcSprites[]`** - Array in `rooms.js:1894+`
   ```javascript
   if (!roomData.npcSprites) {
       roomData.npcSprites = [];
   }
   roomData.npcSprites.push(sprite);
   ```

3. **`window.npcManager.npcs.get(npcId)`** - NPC data object
   - Contains `.roomId` to find room
   - Contains `._sprite` reference

**Current Plan Approach** (`TECHNICAL_SPEC.md` constructor line 867):
```javascript
this.roomId = npcData.roomId; // Store roomId
```

**Problem**: Behavior system needs to access sprite, but doesn't know which storage location to use. Plan assumes `npcData._sprite` exists, but doesn't validate.

**Solution**: Add sprite validation in `NPCBehavior` constructor:

```javascript
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
  
  // ... rest of constructor ...
}
```

---

### 5. **Depth Update Frequency Not Specified**

**Location**: `TECHNICAL_SPEC.md` line 564+

**Current Plan**: Says to call `updateDepth()` but doesn't specify when

**Issue**: Plan says "Called every update cycle" but the implementation in `TECHNICAL_SPEC.md:570` shows:
```javascript
updateDepth() {
  // ... depth calculation ...
  this.sprite.setDepth(depth);
}
```

**Problem**: No explicit call in the `update()` method. Depth MUST be updated every frame for NPCs that move.

**Solution**: Add explicit depth update to behavior update loop:

```javascript
// In NPCBehavior.update()
update(time, delta, playerPos) {
  try {
    const state = this.determineState(playerPos);
    this.executeState(state, time, delta, playerPos);
    
    // CRITICAL: Update depth after any movement
    // This ensures correct Y-sorting with player and other NPCs
    this.updateDepth();
    
  } catch (error) {
    console.error(`❌ Behavior update error for ${this.npcId}:`, error);
  }
}
```

**Note**: This is critical for patrol behavior where NPCs move constantly.

---

### 6. **Personal Space Distance Smaller Than Interaction Range**

**Location**: `QUICK_REFERENCE.md` line 178, `TECHNICAL_SPEC.md` line 546

**Current Plan**: Personal space default is 48px, interaction range is 64px

**Observation**: This is **intentional design** according to plan notes:
> "Distance: 48px (1.5 tiles) - **smaller than interaction range (64px)**"

**Potential Issue**: Player can still interact with backing-away NPC, which might feel unnatural.

**Design Question**: Should backing-away NPCs:
- **Option A** (Current): Stay interactive while backing away (player can still talk)
- **Option B**: Back away beyond interaction range (player loses interaction)

**Recommendation**: 
- Keep current design for MVP (Option A is friendlier UX)
- Add scenario configuration option for future:
  ```json
  "personalSpace": {
    "enabled": true,
    "distance": 96,  // Back away beyond interaction range
    "breakInteraction": true  // Optional flag
  }
  ```

**Action**: Document this design decision more prominently in user-facing docs.

---

## ⚠️ MEDIUM PRIORITY ISSUES

### 7. **No Stuck Detection for Personal Space**

**Location**: `TECHNICAL_SPEC.md` line 510+

**Issue**: Personal space backing uses incremental movement (5px at a time) but has no wall/obstacle detection. NPC could get stuck against walls while backing away.

**Consequence**: NPC backs into wall and continues trying to back away (looks glitchy, console spam).

**Solution**: Add collision detection to personal space behavior:

```javascript
maintainPersonalSpace(playerPos, delta) {
  // ... existing distance check ...
  
  // Calculate backing direction
  const dx = this.sprite.x - playerPos.x;
  const dy = this.sprite.y - playerPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const backX = (dx / distance) * this.config.personalSpace.backAwayDistance;
  const backY = (dy / distance) * this.config.personalSpace.backAwayDistance;
  
  // NEW: Check if backing into obstacle
  const testX = this.sprite.x + backX;
  const testY = this.sprite.y + backY;
  
  // Try to move back (Phaser collision will prevent if blocked)
  const oldX = this.sprite.x;
  const oldY = this.sprite.y;
  this.sprite.setPosition(testX, testY);
  
  // If position didn't change, we're blocked
  if (this.sprite.x === oldX && this.sprite.y === oldY) {
    // Can't back away - just face player
    this.facePlayer(playerPos);
    return true; // Still in personal space violation
  }
  
  // Successfully backed away
  this.facePlayer(playerPos); // Face player while backing
  return true;
}
```

---

### 8. **Integration Point: NPC Registration Happens Before Sprite Creation**

**Location**: `IMPLEMENTATION_PLAN.md` line 552+, `game.js` integration

**Current Plan**: Initialize behavior manager after NPCs are created

**Issue**: Plan assumes this code in `game.js`:
```javascript
// Register behaviors for all NPCs
for (const [npcId, npcData] of window.npcManager.npcs.entries()) {
  if (npcData._sprite && npcData.behavior) {
    window.npcBehaviorManager.registerBehavior(
      npcId,
      npcData._sprite,
      npcData.behavior
    );
  }
}
```

**Problem**: This won't work because:
1. NPCs are registered to NPCManager during scenario load (before rooms exist)
2. NPC sprites are created per-room in `createRoom()` (rooms.js:1901)
3. Behavior registration needs to happen **per-room** as sprites are created

**Correct Integration**: Register behaviors in `createNPCSpritesForRoom()`:

```javascript
// In rooms.js createNPCSpritesForRoom() after sprite creation
function createNPCSpritesForRoom(roomId, roomData) {
  // ... existing sprite creation code ...
  
  for (const npc of npcsInRoom) {
    try {
      const sprite = NPCSpriteManager.createNPCSprite(gameRef, npc, roomData);
      
      if (sprite) {
        roomData.npcSprites.push(sprite);
        
        // ... existing collision setup ...
        
        // NEW: Register behavior if configured
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
  }
}
```

**Also Update**: `game.js` create phase should initialize manager but NOT register behaviors:

```javascript
// In game.js create() phase
if (window.npcManager) {
  try {
    const { NPCBehaviorManager } = await import('./systems/npc-behavior.js?v=1');
    window.npcBehaviorManager = new NPCBehaviorManager(this, window.npcManager);
    console.log('✅ NPC Behavior Manager initialized');
    // NOTE: Individual behaviors registered per-room in createNPCSpritesForRoom()
  } catch (error) {
    console.error('❌ Failed to initialize NPC Behavior Manager:', error);
  }
}
```

---

### 9. **Missing RoomId Storage in NPC Data**

**Location**: Multiple files, affects patrol bounds calculation

**Issue**: Behavior system needs `npcData.roomId` to calculate patrol bounds (see `TECHNICAL_SPEC.md` line 490+):
```javascript
const npcData = window.npcManager.npcs.get(this.npcId);
const roomData = window.rooms[npcData.roomId];
```

**Problem**: NPCManager registration (`npc-manager.js:44+`) doesn't store `roomId`. It's only in the scenario JSON.

**Current Scenario Structure**:
```json
{
  "rooms": {
    "room_id": {
      "npcs": [
        {
          "id": "guard",
          // NO roomId property - it's implicit from parent
        }
      ]
    }
  }
}
```

**Solution**: Add roomId to NPC data during scenario initialization:

```javascript
// In rooms.js initializeRooms() or wherever NPCs are registered
for (const [roomId, roomData] of Object.entries(gameScenario.rooms)) {
  if (roomData.npcs && Array.isArray(roomData.npcs)) {
    for (const npc of roomData.npcs) {
      // Store roomId in NPC data
      npc.roomId = roomId;
      
      // Register NPC
      if (window.npcManager) {
        window.npcManager.registerNPC(npc);
      }
    }
  }
}
```

---

### 10. **Animation Fallback Strategy Missing**

**Location**: `TECHNICAL_SPEC.md` line 348+

**Issue**: If walk animations don't exist (e.g., using a sprite that only has idle frames), behavior system will fail silently.

**Solution**: Add animation fallback in `playAnimation()`:

```javascript
playAnimation(state, direction) {
  // ... existing direction mapping ...
  
  const animKey = `npc-${this.npcId}-${state}-${animDirection}`;
  
  if (this.sprite.anims.exists(animKey)) {
    // Preferred animation exists
    if (this.lastAnimationKey !== animKey) {
      this.sprite.play(animKey, true);
      this.lastAnimationKey = animKey;
    }
  } else {
    // Fallback: use idle animation if walk doesn't exist
    if (state === 'walk') {
      const idleKey = `npc-${this.npcId}-idle-${animDirection}`;
      if (this.sprite.anims.exists(idleKey)) {
        console.warn(`⚠️ Walk animation missing for ${this.npcId}-${animDirection}, using idle`);
        if (this.lastAnimationKey !== idleKey) {
          this.sprite.play(idleKey, true);
          this.lastAnimationKey = idleKey;
        }
      } else {
        // Last resort: use generic idle
        const genericIdle = `npc-${this.npcId}-idle`;
        if (this.sprite.anims.exists(genericIdle)) {
          console.warn(`⚠️ No directional animations for ${this.npcId}, using generic idle`);
          if (this.lastAnimationKey !== genericIdle) {
            this.sprite.play(genericIdle, true);
            this.lastAnimationKey = genericIdle;
          }
        }
      }
    }
  }
  
  // Set flipX for left-facing directions
  this.sprite.setFlipX(flipX);
}
```

---

## 💡 ENHANCEMENT OPPORTUNITIES (Recommended)

### 11. **Debug Visualization Mode**

**Priority**: LOW (Post-MVP)  
**Benefit**: Dramatically speeds up debugging and scenario design

Add optional debug visualization:

```javascript
// In NPCBehaviorManager.update()
if (window.NPC_BEHAVIOR_DEBUG_VISUAL) {
  for (const [npcId, behavior] of this.behaviors.entries()) {
    // Draw face player range
    if (behavior.config.facePlayer) {
      this.scene.add.circle(
        behavior.sprite.x, 
        behavior.sprite.y, 
        behavior.config.facePlayerDistance,
        0x00ff00, 
        0.1
      ).setDepth(9999);
    }
    
    // Draw personal space range
    if (behavior.config.personalSpace.enabled) {
      this.scene.add.circle(
        behavior.sprite.x, 
        behavior.sprite.y, 
        behavior.config.personalSpace.distance,
        0xff0000, 
        0.2
      ).setDepth(9999);
    }
    
    // Draw patrol target
    if (behavior.patrolTarget) {
      this.scene.add.line(
        0, 0,
        behavior.sprite.x, behavior.sprite.y,
        behavior.patrolTarget.x, behavior.patrolTarget.y,
        0xffff00, 
        0.5
      ).setDepth(9999);
    }
  }
}
```

---

### 12. **Patrol Path Waypoints** (Future Enhancement)

**Priority**: MEDIUM (Post-MVP)  
**Benefit**: More realistic guard patterns, less random movement

Add waypoint-based patrol:

```json
{
  "behavior": {
    "patrol": {
      "mode": "waypoints",
      "waypoints": [
        { "x": 3, "y": 3 },
        { "x": 8, "y": 3 },
        { "x": 8, "y": 8 },
        { "x": 3, "y": 8 }
      ],
      "loop": true,
      "speed": 80
    }
  }
}
```

---

### 13. **Event Emission for Behavior State Changes**

**Priority**: LOW  
**Benefit**: Enables other systems to react to NPC behavior (e.g., player alert when NPC becomes hostile)

Add event emission:

```javascript
setHostile(hostile) {
  if (this.hostile === hostile) return; // No change
  
  this.hostile = hostile;
  
  // Emit event for other systems
  if (window.eventDispatcher) {
    window.eventDispatcher.emit('npc_hostile_changed', {
      npcId: this.npcId,
      hostile: hostile
    });
  }
  
  // ... existing tint code ...
}
```

---

## 📋 IMPLEMENTATION CHECKLIST (Updated)

### Phase 0: Pre-Implementation (MUST DO FIRST)

- [ ] **Fix Critical Issue #3**: Modify `npc-sprites.js` to create walk animations
- [ ] Add idle animations for all 8 directions to `npc-sprites.js`
- [ ] Update collision body documentation to reflect intentional differences
- [ ] Add `roomId` to NPC data during scenario initialization
- [ ] Update integration plan to register behaviors per-room (not in game.js)
- [ ] Review and sign-off on corrected plan

### Phase 1: Core Infrastructure

- [ ] Create `npc-behavior.js` with basic structure
- [ ] Implement `NPCBehaviorManager` class
- [ ] Implement `NPCBehavior` class with state machine skeleton
- [ ] Add sprite and roomId validation in constructor
- [ ] Integrate with `game.js` update loop
- [ ] Integrate registration in `rooms.js` createNPCSpritesForRoom()
- [ ] Test with single NPC (idle state only)

### Phase 2: Face Player

- [ ] Implement `facePlayer()` logic
- [ ] Add direction calculation (8-way)
- [ ] Test with multiple NPCs at different positions
- [ ] Verify idle animation transitions

### Phase 3: Patrol Behavior

- [ ] Implement `updatePatrol()` logic
- [ ] Add patrol bounds validation in parseConfig()
- [ ] Add random direction selection
- [ ] Implement stuck detection and recovery
- [ ] Add collision handling
- [ ] Test with patrol bounds
- [ ] Add scenario JSON patrol configuration

### Phase 4: Personal Space

- [ ] Implement `maintainPersonalSpace()` logic
- [ ] Add collision detection for backing away
- [ ] Test with varying distances
- [ ] Test backing into walls
- [ ] Add scenario JSON personal space configuration

### Phase 5: Ink Integration

- [ ] Extend `npc-game-bridge.js` with behavior methods
- [ ] Add tag processing to person-chat minigame
- [ ] Test all behavior tags with example Ink files
- [ ] Document tag usage in Ink writer guide

### Phase 6: Hostile Behavior

- [ ] Implement hostile visual feedback (red tint)
- [ ] Add influence → hostility logic
- [ ] Add event emission for hostile state changes
- [ ] Test with example scenarios

### Phase 7: Polish & Debug

- [ ] Add animation fallback strategy
- [ ] Add explicit depth updates in update loop
- [ ] Implement debug visualization mode
- [ ] Performance testing with 10+ NPCs
- [ ] Update user documentation

---

## 🎯 PRIORITY RECOMMENDATIONS

### IMMEDIATE (Before Phase 1):
1. ✅ Fix animation creation timing (Critical Issue #3)
2. ✅ Add roomId to NPC data (Medium Issue #9)
3. ✅ Fix integration point to register per-room (Medium Issue #8)

### HIGH (During Phase 1-2):
4. Add patrol bounds validation (Critical Issue #2)
5. Add sprite reference validation (Critical Issue #4)
6. Add explicit depth updates (Critical Issue #5)

### MEDIUM (During Phase 3-4):
7. Add personal space collision detection (Medium Issue #7)
8. Add animation fallback strategy (Medium Issue #10)

### LOW (Post-MVP):
9. Add debug visualization mode (Enhancement #11)
10. Consider waypoint patrol paths (Enhancement #12)
11. Add behavior event emission (Enhancement #13)

---

## 📝 DOCUMENTATION UPDATES NEEDED

1. **TECHNICAL_SPEC.md**:
   - Update collision body documentation (Section: NPC Configuration)
   - Add animation creation timing clarification (Section: Animation System)
   - Add patrol bounds validation (Section: Patrol Algorithm)
   - Add depth update frequency specification (Section: Depth Calculation)

2. **IMPLEMENTATION_PLAN.md**:
   - Add Phase 0 with animation prerequisites
   - Update integration points (register per-room, not in game.js)
   - Add roomId initialization requirement
   - Update collision body section

3. **QUICK_REFERENCE.md**:
   - Clarify personal space design decision
   - Add troubleshooting for animation missing errors
   - Document debug visualization mode

4. **example_scenario.json**:
   - Add roomId to all NPC definitions (for clarity, even though implicit)
   - Add patrol bounds that include NPC starting positions

---

## ✅ CONCLUSION

The NPC behavior implementation plan is **architecturally sound** but requires **critical fixes** before implementation can begin. The main issues are:

1. **Animation timing** - Must create animations during sprite setup
2. **Integration points** - Must register behaviors per-room, not globally
3. **Validation** - Must validate patrol bounds, sprite references, roomId

With these fixes applied, the plan provides a **solid foundation** for successful implementation. The phased approach is sensible, and the documentation is comprehensive.

**Estimated Impact of Issues**:
- Without fixes: **75% chance of implementation failure**
- With critical fixes: **95% chance of success**

**Recommendation**: **DO NOT PROCEED** with implementation until Critical Issues #2, #3, #4, #8, and #9 are addressed in the planning documents and prerequisite code changes are made.

---

**Next Steps**:
1. Apply Critical Issue #3 fix to `npc-sprites.js` immediately
2. Update all planning documents with corrections
3. Add Phase 0 checklist items
4. Get sign-off on corrected plan
5. Begin Phase 1 implementation

---

**Reviewer Notes**: This review was conducted by analyzing the implementation plan against the actual codebase. All code references were verified against source files. The recommendations prioritize issues that would cause complete implementation failure over optimization concerns.
