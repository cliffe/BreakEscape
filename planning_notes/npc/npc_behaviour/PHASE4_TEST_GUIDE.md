# Phase 4: Personal Space Behavior - Test Guide

## Overview

Phase 4 focuses on testing and verifying the **Personal Space** behavior. This makes NPCs back away from the player when they get too close, creating realistic social distancing behavior.

**Status**: ✅ Implementation Complete, Ready for Testing

---

## What Was Implemented

### Core Functionality

1. **Distance-Based Activation**
   - NPCs detect when player enters personal space bubble
   - Configurable distance (default: 48px / 1.5 tiles)
   - Only activates when enabled

2. **Gradual Backing Away**
   - Small incremental movements (default: 5px per update)
   - Configurable back-away distance
   - Smooth, natural-looking retreat

3. **Face Player While Backing**
   - NPC maintains eye contact during retreat
   - Uses idle animation (not walk)
   - Direction updates to face player

4. **Wall Collision Detection**
   - NPCs can't back through walls
   - Position validation after movement attempt
   - Falls back to face-only when blocked

5. **Priority Integration**
   - Personal Space is Priority 3 (high priority)
   - Overrides patrol and face player
   - Only overridden by hostile behaviors (chase/flee)

6. **Ink Tag Control**
   - `#personal_space:64` - Set distance to 64px
   - `#personal_space:0` - Disable personal space
   - Runtime distance adjustment

---

## Test Scenario

**File**: `scenarios/test-npc-personal-space.json`

This scenario contains 10 NPCs testing various personal space configurations:

### Test NPCs

| NPC ID | Position | Distance | Back Speed | Increment | Test Purpose |
|--------|----------|----------|------------|-----------|--------------|
| `personal_space_basic` | (5,5) | 48px | 30px/s | 5px | Standard config |
| `personal_space_large` | (8,3) | 96px | 30px/s | 5px | Large bubble (3 tiles) |
| `personal_space_small` | (2,3) | 32px | 30px/s | 5px | Small bubble (1 tile) |
| `personal_space_fast` | (8,8) | 48px | 60px/s | 10px | Fast backing |
| `personal_space_slow` | (2,8) | 48px | 15px/s | 3px | Slow backing |
| `personal_space_corner` | (1,1) | 64px | 30px/s | 5px | Wall collision test |
| `personal_space_with_patrol` | (5,2) | 48px | 30px/s | 5px | Patrol + space |
| `personal_space_toggle` | (10,5) | 48px | 30px/s | 5px | Ink toggle test |
| `personal_space_very_shy` | (5,8) | 128px | 40px/s | 8px | Extreme (4 tiles) |
| `no_personal_space` | (9,1) | N/A | N/A | N/A | Disabled |

### Visual Layout

```
Room: test_personal_space (room_office)

      1  2  3  4  5  6  7  8  9  10
   1  [Corner]                [Disabled]
   2           [WithPatrol]
   3     [Small]      [Large]
   4
   5              [Basic]           [Toggle]
   6
   7
   8     [Slow]   [VeryShy] [Fast]
   9
```

---

## How to Test

### Setup

1. **Load Test Scenario**:
   ```javascript
   window.gameScenario = await fetch('scenarios/test-npc-personal-space.json').then(r => r.json());
   // Then reload game
   ```

2. **Verify Behavior Manager**:
   ```javascript
   console.log('Behavior Manager:', window.npcBehaviorManager);
   const behavior = window.npcBehaviorManager.getBehavior('personal_space_basic');
   console.log('Personal space config:', behavior.config.personalSpace);
   ```

---

## Test Procedures

### Test 1: Basic Personal Space

**NPC**: `personal_space_basic` (center, blue)

**Configuration**:
- Distance: 48px (1.5 tiles)
- Back speed: 30px/s
- Increment: 5px

**Procedure**:
1. Start far from NPC (> 3 tiles away)
2. Slowly walk toward NPC
3. Observe at different distances

**Expected Behavior**:

**When Far (> 48px)**:
- ✅ NPC turns to face player (face player behavior)
- ✅ NPC stays in place
- ✅ Uses idle animation
- ✅ State: `'face_player'`

**When Close (< 48px)**:
- ✅ NPC starts backing away
- ✅ NPC moves in 5px increments
- ✅ NPC faces player while backing
- ✅ Uses idle animation (NOT walk)
- ✅ State: `'maintain_space'`
- ✅ Backing is gradual and smooth

**When Very Close (touching)**:
- ✅ NPC continues backing until blocked or out of range
- ✅ Movement is continuous but slow
- ✅ Direction adjusts as player circles NPC

**Debug**:
```javascript
const behavior = window.npcBehaviorManager.getBehavior('personal_space_basic');
const sprite = window.npcManager.npcs.get('personal_space_basic')._sprite;
const player = window.player;

setInterval(() => {
    const dx = sprite.x - player.x;
    const dy = sprite.y - player.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    console.log('Distance:', Math.round(dist),
                'State:', behavior.currentState,
                'Backing:', behavior.backingAway);
}, 500);
```

---

### Test 2: Personal Space Bubble Sizes

**NPCs**: Small (32px), Basic (48px), Large (96px), Very Shy (128px)

**Procedure**:
1. Stand exactly 2 tiles (64px) from each NPC
2. Observe which NPCs react
3. Slowly approach each NPC
4. Note activation distances

**Expected Results**:

| NPC | Distance | At 64px | At 48px | At 32px |
|-----|----------|---------|---------|---------|
| Small (32px) | 1 tile | No reaction | No reaction | ✅ Backs away |
| Basic (48px) | 1.5 tiles | No reaction | ✅ Backs away | ✅ Backs away |
| Large (96px) | 3 tiles | ✅ Backs away | ✅ Backs away | ✅ Backs away |
| Very Shy (128px) | 4 tiles | ✅ Backs away | ✅ Backs away | ✅ Backs away |

**Verification**:
```javascript
// Check personal space distances
['personal_space_small', 'personal_space_basic',
 'personal_space_large', 'personal_space_very_shy'].forEach(id => {
    const behavior = window.npcBehaviorManager.getBehavior(id);
    console.log(`${id}: ${behavior.config.personalSpace.distance}px`);
});
```

---

### Test 3: Backing Speed Variations

**NPCs**: Slow (3px), Basic (5px), Fast (10px)

**Procedure**:
1. Approach each NPC within personal space range
2. Stand still and let them back away
3. Compare backing speeds visually

**Expected Behavior**:

**Slow (3px increments)**:
- ✅ Very subtle backing
- ✅ Barely noticeable movement
- ✅ Natural, gentle retreat

**Basic (5px increments)**:
- ✅ Moderate backing speed
- ✅ Clearly visible but not jarring
- ✅ Smooth, natural movement

**Fast (10px increments)**:
- ✅ Noticeably faster retreat
- ✅ More obvious backing behavior
- ✅ Still smooth (not teleporting)

**Measurement**:
```javascript
// Track backing distance over time
const sprite = window.npcManager.npcs.get('personal_space_fast')._sprite;
let startX = sprite.x;
let startY = sprite.y;

setTimeout(() => {
    const dx = sprite.x - startX;
    const dy = sprite.y - startY;
    const totalDist = Math.sqrt(dx*dx + dy*dy);
    console.log('Distance backed in 5s:', Math.round(totalDist), 'px');
    // Fast should be ~2x Basic
}, 5000);
```

---

### Test 4: Wall Collision Detection

**NPC**: `personal_space_corner` (position 1,1 - top-left corner)

**Setup**: NPC is positioned near room corner

**Procedure**:
1. Approach NPC from the southeast (open side)
2. Push NPC toward the corner (walls at north and west)
3. Continue approaching

**Expected Behavior**:

**When Space Available**:
- ✅ NPC backs away normally
- ✅ Moves in configured increments (5px)
- ✅ Faces player while backing

**When Backed Into Wall**:
- ✅ NPC attempts to back away
- ✅ Position doesn't change (wall blocks)
- ✅ NPC still faces player
- ✅ State remains `'maintain_space'`
- ✅ No console errors
- ✅ No jittering or stuck behavior

**When Player Leaves Range**:
- ✅ NPC stops backing attempt
- ✅ Returns to normal face player behavior
- ✅ State: `'face_player'` or `'idle'`

**Debug**:
```javascript
const sprite = window.npcManager.npcs.get('personal_space_corner')._sprite;
let lastX = sprite.x;
let lastY = sprite.y;

setInterval(() => {
    const movedX = sprite.x - lastX;
    const movedY = sprite.y - lastY;
    if (movedX === 0 && movedY === 0) {
        console.log('🚧 NPC blocked by wall (not moving)');
    }
    lastX = sprite.x;
    lastY = sprite.y;
}, 100);
```

---

### Test 5: Personal Space + Patrol Integration

**NPC**: `personal_space_with_patrol` (position 5,2)

**Configuration**:
- Patrol: enabled, 80px/s
- Personal space: 48px, 5px increments

**Procedure**:
1. Stay far from NPC (> 3 tiles)
2. Observe patrol behavior
3. Approach within 48px while NPC patrols
4. Walk away

**Expected Behavior**:

**When Far (patrolling)**:
- ✅ NPC patrols area normally
- ✅ Uses walk animations
- ✅ Changes direction periodically
- ✅ State: `'patrol'`

**When Near (personal space violated)**:
- ✅ NPC stops patrolling immediately
- ✅ NPC backs away from player
- ✅ Uses idle animation (not walk)
- ✅ Faces player while backing
- ✅ State: `'maintain_space'`
- ✅ Velocity becomes minimal (not patrol velocity)

**When Leaving (player exits bubble)**:
- ✅ NPC resumes patrol
- ✅ Picks new patrol target
- ✅ Resumes walk animations
- ✅ State returns to `'patrol'`

**State Priority Check**:
```javascript
const behavior = window.npcBehaviorManager.getBehavior('personal_space_with_patrol');
setInterval(() => {
    const sprite = window.npcManager.npcs.get('personal_space_with_patrol')._sprite;
    const player = window.player;
    const dist = Math.sqrt((sprite.x - player.x)**2 + (sprite.y - player.y)**2);

    console.log('Distance:', Math.round(dist),
                'State:', behavior.currentState,
                'Expected:', dist < 48 ? 'maintain_space' : 'patrol');
}, 500);
```

---

### Test 6: Direction While Backing

**NPC**: Any NPC with personal space enabled

**Procedure**:
1. Approach NPC from the north (below them)
2. NPC should back away north and face south (down)
3. Circle around NPC while staying close
4. Observe direction changes

**Expected Behavior**:

**Approach from South**:
- ✅ NPC backs north (away from player)
- ✅ NPC faces south (toward player)
- ✅ Direction: `'down'`

**Approach from North**:
- ✅ NPC backs south
- ✅ NPC faces north
- ✅ Direction: `'up'`

**Approach from East**:
- ✅ NPC backs west
- ✅ NPC faces east (right)
- ✅ Direction: `'right'`

**Approach from West**:
- ✅ NPC backs east
- ✅ NPC faces west (left with flipX)
- ✅ Direction: `'left'`

**Diagonal Approaches**:
- ✅ NPC backs in opposite diagonal
- ✅ Faces player in diagonal direction
- ✅ Directions: `'up-left'`, `'up-right'`, `'down-left'`, `'down-right'`

**Direction Calculation**:
```javascript
// In maintainPersonalSpace():
// Backing direction: (dx, dy) = away from player
// Facing direction: (-dx, -dy) = toward player
const behavior = window.npcBehaviorManager.getBehavior('personal_space_basic');
console.log('Facing direction:', behavior.direction);
console.log('Should face player, not back direction');
```

---

### Test 7: Animation During Personal Space

**Procedure**:
1. Trigger personal space behavior
2. Check animation state

**Expected**:
- ✅ Uses idle animation (NOT walk)
- ✅ Animation matches facing direction
- ✅ FlipX applied for left directions
- ✅ No animation flickering

**Why Idle, Not Walk?**:
- Backing away is not "walking"
- Movement is slow and incremental
- Creates subtle, polite retreat behavior
- Walk animation would look unnatural for small movements

**Verification**:
```javascript
const sprite = window.npcManager.npcs.get('personal_space_basic')._sprite;
const behavior = window.npcBehaviorManager.getBehavior('personal_space_basic');

// When in personal space
console.log('Animation:', sprite.anims.currentAnim?.key);
console.log('Expected:', `npc-personal_space_basic-idle-${behavior.direction}`);
console.log('State:', behavior.currentState); // Should be 'maintain_space'
console.log('Is Moving:', behavior.isMoving); // Should be false
```

---

### Test 8: Staying Within Interaction Range

**Concept**: NPCs should stay close enough to interact (64px) even while backing

**Procedure**:
1. Approach NPC with 48px personal space
2. Stay at exactly 48px
3. NPC should stop backing (at boundary)

**Expected**:
- ✅ NPC backs away when < 48px
- ✅ NPC stops when ≥ 48px
- ✅ NPC remains within interaction range (64px typical)
- ✅ Can still talk to NPC (E key works)

**Note**: Personal space distance should be less than interaction range
- Default interaction: 64px (2 tiles)
- Default personal space: 48px (1.5 tiles)
- ✅ Gap of 16px ensures NPC stays interactable

---

### Test 9: Personal Space Toggle via Ink

**NPC**: `personal_space_toggle` (position 10,5)

**Procedure**:
1. Approach NPC - should NOT back away (disabled initially)
2. Talk to NPC
3. Select "Enable personal space (64px)"
4. Exit conversation
5. Approach again - should back away now
6. Talk again, select "Disable personal space"
7. Approach - should NOT back away anymore

**Expected Behavior**:

**Initial State (disabled)**:
- ✅ NPC faces player when close
- ✅ Does NOT back away
- ✅ Personal space enabled: `false`
- ✅ State: `'face_player'`

**After "Enable personal space (64px)"**:
- ✅ Tag `#personal_space:64` processed
- ✅ Personal space enabled: `true`
- ✅ Distance set to 64px
- ✅ NPC backs away when < 64px
- ✅ State: `'maintain_space'` when close

**After "Disable personal space"**:
- ✅ Tag `#personal_space:0` processed
- ✅ Personal space enabled: `false`
- ✅ NPC stops backing away
- ✅ Returns to face player only

**Verification**:
```javascript
const behavior = window.npcBehaviorManager.getBehavior('personal_space_toggle');
console.log('Enabled:', behavior.config.personalSpace.enabled);
console.log('Distance:', behavior.config.personalSpace.distance);
```

---

### Test 10: Disabled Personal Space

**NPC**: `no_personal_space` (position 9,1)

**Configuration**: `personalSpace.enabled = false`

**Procedure**:
1. Approach NPC very closely
2. Get right on top of NPC
3. Circle around NPC

**Expected Behavior**:
- ✅ NPC never backs away
- ✅ NPC only faces player (normal behavior)
- ✅ Can walk right up to NPC
- ✅ State: `'face_player'` or `'idle'`
- ✅ No personal space state ever triggered

**Comparison Test**:
```javascript
// Compare disabled vs enabled
const disabled = window.npcBehaviorManager.getBehavior('no_personal_space');
const enabled = window.npcBehaviorManager.getBehavior('personal_space_basic');

console.log('Disabled enabled?', disabled.config.personalSpace.enabled); // false
console.log('Enabled enabled?', enabled.config.personalSpace.enabled);   // true

// Get very close to both and observe difference
```

---

## Edge Cases

### Edge Case 1: Player Exactly on NPC Position

**Scenario**: Player moves to exact same position as NPC

**Expected**:
- Distance = 0
- Division by zero check: `if (distance === 0) return false`
- ✅ No crash
- ✅ NPC doesn't move (can't calculate direction)
- ✅ Falls back to face player behavior

**Test**:
```javascript
// Teleport player to NPC position
const sprite = window.npcManager.npcs.get('personal_space_basic')._sprite;
window.player.setPosition(sprite.x, sprite.y);
// Should not crash, NPC should handle gracefully
```

---

### Edge Case 2: Continuous Pressure

**Scenario**: Player continuously walks into NPC

**Expected**:
- ✅ NPC continuously backs away
- ✅ Movement is smooth (not jittery)
- ✅ NPC doesn't get "stuck"
- ✅ Backs until blocked by wall or out of bounds

---

### Edge Case 3: Multiple Players (Not Applicable)

**Scenario**: Only one player in game

**Note**: Personal space only tracks main player position

---

### Edge Case 4: Very Large Personal Space

**Scenario**: `personal_space_very_shy` with 128px (4 tiles)

**Expected**:
- ✅ NPC backs away from very far
- ✅ Player can barely approach
- ✅ No performance issues
- ✅ State changes correctly

---

### Edge Case 5: Backing Into Another NPC

**Scenario**: NPC backs into another NPC

**Expected**:
- ✅ Collision with other NPC prevents movement
- ✅ Position doesn't change (blocked)
- ✅ Falls back to face player
- ✅ No errors

**Note**: NPCs have collision with each other (from Phase 1 setup)

---

## Performance Testing

### Test: Multiple NPCs with Personal Space

**Procedure**:
1. Load test scenario (10 NPCs, 9 with personal space)
2. Walk around room triggering multiple personal space zones
3. Monitor FPS

**Expected Performance**:
- ✅ 60 FPS with all NPCs active
- ✅ No lag when triggering personal space
- ✅ Smooth backing animations
- ✅ CPU usage reasonable

**Debug**:
```javascript
// Monitor FPS
let frames = 0;
window.game.scene.scenes[0].events.on('postupdate', () => frames++);
setInterval(() => {
    console.log('FPS:', frames);
    frames = 0;
}, 1000);
```

---

## Common Issues

### Issue 1: NPC Not Backing Away

**Symptoms**: NPC faces player but doesn't back away

**Possible Causes**:
1. Personal space disabled: `enabled === false`
2. Player outside distance: `playerDist >= config.distance`
3. Higher priority behavior active (shouldn't be any)
4. Backed into wall (position not changing)

**Debug**:
```javascript
const behavior = window.npcBehaviorManager.getBehavior('npc_id');
const sprite = window.npcManager.npcs.get('npc_id')._sprite;
const player = window.player;
const dx = sprite.x - player.x;
const dy = sprite.y - player.y;
const dist = Math.sqrt(dx*dx + dy*dy);

console.log('Enabled:', behavior.config.personalSpace.enabled);
console.log('Distance:', Math.round(dist), '/', behavior.config.personalSpace.distance);
console.log('State:', behavior.currentState);
console.log('Backing:', behavior.backingAway);
```

---

### Issue 2: NPC Backing Too Fast/Slow

**Symptoms**: Backing speed doesn't match config

**Check**:
```javascript
const behavior = window.npcBehaviorManager.getBehavior('npc_id');
console.log('Back away distance:', behavior.config.personalSpace.backAwayDistance);
console.log('Back away speed:', behavior.config.personalSpace.backAwaySpeed);
```

**Note**: `backAwaySpeed` is not currently used (may be for future enhancements)
- Actual speed is `backAwayDistance` per update cycle (50ms)
- Effective speed ≈ `backAwayDistance * 20` px/s

---

### Issue 3: Wrong Facing Direction

**Symptoms**: NPC faces away from player while backing

**Expected**: NPC should face TOWARD player (negative of backing direction)

**Check**:
```javascript
// In maintainPersonalSpace():
// Backing vector: (dx, dy) = sprite.x - player.x (away from player)
// Facing vector: (-dx, -dy) = negative (toward player)
this.direction = this.calculateDirection(-dx, -dy);
```

---

### Issue 4: Walk Animation Instead of Idle

**Symptoms**: NPC uses walk animation while backing

**Expected**: Should use idle animation

**Check**:
```javascript
const sprite = window.npcManager.npcs.get('npc_id')._sprite;
console.log('Animation:', sprite.anims.currentAnim?.key);
// Should be: npc-{npcId}-idle-{direction}
// NOT: npc-{npcId}-walk-{direction}
```

---

## Success Criteria

✅ **Phase 4 Complete When**:

1. [ ] All 10 test NPCs implemented
2. [ ] Basic personal space backing works
3. [ ] Bubble size variations work (32px to 128px)
4. [ ] Backing speed variations work
5. [ ] Wall collision detection works (can't back through walls)
6. [ ] Personal space + patrol integration works
7. [ ] NPCs face player while backing
8. [ ] Idle animations used (not walk)
9. [ ] NPCs stay within interaction range
10. [ ] Ink toggle enables/disables personal space
11. [ ] Disabled NPCs don't back away
12. [ ] No console errors
13. [ ] Performance good with 9 NPCs (60 FPS)

---

## Implementation Details

### Personal Space Algorithm

```javascript
maintainPersonalSpace(playerPos, delta):
  1. Check if enabled and player position valid
  2. Calculate dx, dy (away from player)
  3. Calculate distance to player
  4. If distance = 0: return (avoid division by zero)
  5. Calculate target position (5px away)
  6. Attempt to move to target
  7. Check if position changed:
     - Changed: Successfully backed away
     - Not changed: Blocked by wall, face player instead
  8. Calculate facing direction (toward player)
  9. Play idle animation for facing direction
  10. Set isMoving = false, backingAway = true
  11. Return true (personal space active)
```

### Why Small Increments?

- **5px per update** (every 50ms) = **100px/s effective speed**
- Creates smooth, gradual retreat
- Natural-looking social distancing
- Gives player time to react
- Doesn't look like NPC is "fleeing"

---

## Next Steps

After Phase 4:
- **Phase 5**: Ink Integration comprehensive testing
- **Phase 6**: Hostile visual feedback
- **Phase 7**: Advanced features (chase/flee stubs)

---

**Document Status**: Test Guide v1.0
**Last Updated**: 2025-11-09
**Phase**: 4 - Personal Space Behavior Testing
