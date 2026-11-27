# Phase 3: Patrol Behavior - Test Guide

## Overview

Phase 3 focuses on testing and verifying the **Patrol** behavior. This makes NPCs move randomly within defined bounds, creating dynamic, living environments.

**Status**: ✅ Implementation Complete, Ready for Testing

---

## What Was Implemented

### Core Functionality

1. **Random Movement Within Bounds**
   - NPCs pick random target points within configured bounds
   - Move toward target using velocity-based physics
   - Pick new target when reached (< 8px distance)

2. **Timed Direction Changes**
   - Configurable interval (default: 3000ms)
   - New random target chosen at each interval
   - Prevents NPCs from getting "stuck" in patterns

3. **Stuck Detection & Recovery**
   - Detects when NPC is blocked by collision
   - 500ms timeout before choosing new direction
   - Prevents infinite collision loops

4. **Walk Animations**
   - 8-way walk animations during movement
   - Direction calculated based on velocity
   - Smooth animation transitions

5. **Collision Handling**
   - NPCs collide with walls, chairs, and other objects
   - Physics-based collision response
   - Automatic recovery from stuck states

6. **Priority Integration**
   - Patrol is Priority 2 (overridden by higher priorities)
   - Face Player (Priority 1) can interrupt patrol
   - Personal Space (Priority 3) overrides patrol

---

## Test Scenario

**File**: `scenarios/test-npc-patrol.json`

This scenario contains 9 NPCs testing various patrol configurations:

### Test NPCs

| NPC ID | Position | Speed | Interval | Bounds | Test Purpose |
|--------|----------|-------|----------|--------|--------------|
| `patrol_basic` | (3,3) | 100 | 3000ms | 6x6 tiles | Standard patrol |
| `patrol_fast` | (8,3) | 200 | 2000ms | 4x4 tiles | High speed |
| `patrol_slow` | (3,8) | 50 | 5000ms | 4x3 tiles | Low speed |
| `patrol_small` | (8,8) | 80 | 2000ms | 2x2 tiles | Tiny area |
| `patrol_with_face` | (5,5) | 100 | 4000ms | 4x4 tiles | Patrol + face player |
| `patrol_narrow_horizontal` | (1,1) | 100 | 3000ms | 8x1 tiles | Corridor test |
| `patrol_narrow_vertical` | (1,5) | 100 | 3000ms | 1x5 tiles | Corridor test |
| `patrol_initially_disabled` | (10,5) | 100 | 3000ms | 3x3 tiles | Toggle via Ink |
| `patrol_stuck_test` | (6,1) | 120 | 4000ms | 3x3 tiles | Collision test |

### Visual Layout

```
Room: test_patrol (room_office)

      1  2  3  4  5  6  7  8  9  10
   1  [NarrowH] [NarrowH] [Stuck]
   2
   3     [Basic]            [Fast]
   4
   5  [NarrowV] [WithFace]         [Toggle]
   6
   7
   8     [Slow]             [Small]
   9
```

---

## How to Test

### Setup

1. **Load Test Scenario**:
   ```javascript
   window.gameScenario = await fetch('scenarios/test-npc-patrol.json').then(r => r.json());
   // Then reload game
   ```

2. **Verify Behavior Manager**:
   ```javascript
   console.log('Behavior Manager:', window.npcBehaviorManager);
   console.log('Registered behaviors:', window.npcBehaviorManager.behaviors.size);
   ```

---

## Test Procedures

### Test 1: Basic Patrol Movement

**NPC**: `patrol_basic` (blue, position 3,3)

**Configuration**:
- Speed: 100px/s
- Interval: 3000ms (3 seconds)
- Bounds: 6x6 tiles (192x192px)

**Procedure**:
1. Observe NPC from a distance (don't approach)
2. Watch for 30 seconds

**Expected Behavior**:
- ✅ NPC should walk to random points within 6x6 area
- ✅ Changes direction every 3 seconds
- ✅ Uses walk animations (8 directions)
- ✅ Smooth movement, no jittering
- ✅ Stays within bounds (2-7 tiles from origin)
- ✅ Direction matches movement (walks forward, not sideways)

**Measurements**:
```javascript
const behavior = window.npcBehaviorManager.getBehavior('patrol_basic');
console.log('Current target:', behavior.patrolTarget);
console.log('Direction:', behavior.direction);
console.log('Is moving:', behavior.isMoving);
console.log('Current state:', behavior.currentState); // Should be 'patrol'
```

---

### Test 2: Speed Variations

**NPCs**: `patrol_fast` (200px/s) vs `patrol_slow` (50px/s)

**Procedure**:
1. Observe both NPCs simultaneously
2. Compare movement speeds visually

**Expected Behavior**:
- ✅ `patrol_fast` moves noticeably faster (2x basic speed)
- ✅ `patrol_slow` moves noticeably slower (0.5x basic speed)
- ✅ Both use correct walk animation frame rate (8 fps)
- ✅ Animation doesn't look sped up/slowed down (velocity changes, not animation)
- ✅ Fast NPC reaches targets quicker
- ✅ Slow NPC appears to "stroll"

**Debug**:
```javascript
// Check velocities
const fast = window.npcManager.npcs.get('patrol_fast')._sprite;
const slow = window.npcManager.npcs.get('patrol_slow')._sprite;
console.log('Fast velocity:', Math.sqrt(fast.body.velocity.x**2 + fast.body.velocity.y**2));
console.log('Slow velocity:', Math.sqrt(slow.body.velocity.x**2 + slow.body.velocity.y**2));
// Fast should be ~200, Slow should be ~50
```

---

### Test 3: Direction Change Intervals

**NPCs**: Various intervals

- `patrol_fast`: 2000ms (2 seconds)
- `patrol_basic`: 3000ms (3 seconds)
- `patrol_slow`: 5000ms (5 seconds)

**Procedure**:
1. Time direction changes with a stopwatch
2. Observe for 30 seconds
3. Count direction changes

**Expected Results**:
- ✅ `patrol_fast`: ~15 direction changes in 30s
- ✅ `patrol_basic`: ~10 direction changes in 30s
- ✅ `patrol_slow`: ~6 direction changes in 30s
- ✅ Changes are roughly consistent (±10%)
- ✅ NPC picks different target each time (not same point)

**Debug**:
```javascript
// Monitor direction changes
const behavior = window.npcBehaviorManager.getBehavior('patrol_basic');
let lastTarget = null;
setInterval(() => {
    if (JSON.stringify(behavior.patrolTarget) !== lastTarget) {
        console.log('Direction changed:', behavior.patrolTarget);
        lastTarget = JSON.stringify(behavior.patrolTarget);
    }
}, 100);
```

---

### Test 4: Bounds Validation

**NPC**: `patrol_basic` (6x6 tile bounds)

**Bounds Configuration**:
```json
{
  "x": 64,
  "y": 64,
  "width": 192,
  "height": 192
}
```

**World Coordinates**: (64, 64) to (256, 256)

**Procedure**:
1. Observe NPC for 1 minute
2. Note maximum/minimum X and Y positions reached

**Expected Behavior**:
- ✅ NPC X position: 64 ≤ X ≤ 256
- ✅ NPC Y position: 64 ≤ Y ≤ 256
- ✅ NPC never leaves bounds area
- ✅ Targets are distributed throughout bounds (not clustered)

**Debug**:
```javascript
// Track bounds violations
const behavior = window.npcBehaviorManager.getBehavior('patrol_basic');
const sprite = window.npcManager.npcs.get('patrol_basic')._sprite;
const bounds = behavior.config.patrol.worldBounds;

setInterval(() => {
    const x = sprite.x;
    const y = sprite.y;
    if (x < bounds.x || x > bounds.x + bounds.width ||
        y < bounds.y || y > bounds.y + bounds.height) {
        console.error('❌ BOUNDS VIOLATION:', {x, y, bounds});
    }
}, 100);
```

---

### Test 5: Stuck Detection & Recovery

**NPC**: `patrol_stuck_test`

**Setup**:
1. Place obstacles in patrol area (if possible)
2. Observe NPC encountering obstacles

**Procedure**:
1. Watch NPC patrol
2. Wait for NPC to hit a wall or obstacle
3. Observe recovery behavior

**Expected Behavior**:
- ✅ NPC walks toward wall/obstacle
- ✅ NPC stops when colliding (blocked state)
- ✅ After ~500ms, NPC chooses new direction
- ✅ New direction avoids the obstacle
- ✅ NPC doesn't get permanently stuck
- ✅ No console errors

**Debug**:
```javascript
// Monitor stuck states
const behavior = window.npcBehaviorManager.getBehavior('patrol_stuck_test');
const sprite = window.npcManager.npcs.get('patrol_stuck_test')._sprite;

setInterval(() => {
    const isBlocked = sprite.body.blocked.none === false;
    if (isBlocked) {
        console.log('🚧 NPC stuck! Timer:', behavior.stuckTimer, 'ms');
    }
}, 100);
```

---

### Test 6: Narrow Area Patrol

**NPCs**:
- `patrol_narrow_horizontal` (8x1 tiles - horizontal corridor)
- `patrol_narrow_vertical` (1x5 tiles - vertical corridor)

**Procedure**:
1. Observe horizontal NPC - should mostly move left/right
2. Observe vertical NPC - should mostly move up/down
3. Check animations match movement direction

**Expected Behavior**:

**Horizontal NPC**:
- ✅ Primarily uses `walk-left` and `walk-right` animations
- ✅ Rarely uses vertical animations
- ✅ Stays within 8-tile wide corridor
- ✅ Smooth horizontal movement

**Vertical NPC**:
- ✅ Primarily uses `walk-up` and `walk-down` animations
- ✅ Rarely uses horizontal animations
- ✅ Stays within 1-tile wide corridor
- ✅ Smooth vertical movement

---

### Test 7: Patrol + Face Player Interaction

**NPC**: `patrol_with_face` (center, red sprite)

**Configuration**:
- Patrol: enabled, 100px/s
- Face Player: enabled, 96px range

**Procedure**:
1. Stay far from NPC (>3 tiles)
2. Observe patrol behavior
3. Approach within 3 tiles
4. Walk away

**Expected Behavior**:

**When Far (>3 tiles)**:
- ✅ NPC patrols normally
- ✅ Uses walk animations
- ✅ Changes direction every 4 seconds
- ✅ State: `'patrol'`

**When Near (<3 tiles)**:
- ✅ NPC stops patrolling
- ✅ NPC turns to face player
- ✅ Uses idle animation facing player
- ✅ Velocity becomes (0, 0)
- ✅ State: `'face_player'`

**When Leaving**:
- ✅ NPC resumes patrol after player leaves range
- ✅ Picks new random target
- ✅ Resumes walk animations
- ✅ State returns to `'patrol'`

**Debug**:
```javascript
const behavior = window.npcBehaviorManager.getBehavior('patrol_with_face');
setInterval(() => {
    console.log('State:', behavior.currentState,
                'Is Moving:', behavior.isMoving,
                'Direction:', behavior.direction);
}, 500);
```

---

### Test 8: Small Area Patrol

**NPC**: `patrol_small` (2x2 tiles only)

**Procedure**:
1. Observe NPC in tiny area
2. Watch for 30 seconds

**Expected Behavior**:
- ✅ NPC moves within 2x2 tile area only
- ✅ Frequent direction changes (targets nearby)
- ✅ Reaches targets quickly (small distances)
- ✅ No getting stuck in corners
- ✅ Smooth transitions despite small space

**Edge Case Check**:
- Target point might be very close to current position
- Should still move smoothly, not jitter

---

### Test 9: Patrol Toggle via Ink

**NPC**: `patrol_initially_disabled`

**Procedure**:
1. Observe NPC initially - should be stationary
2. Talk to NPC (E key when nearby)
3. Select "Start patrolling"
4. Exit conversation - NPC should start moving
5. Talk again, select "Stop patrolling"
6. Exit - NPC should stop

**Expected Behavior**:

**Initial State**:
- ✅ NPC is stationary (idle animation)
- ✅ NPC faces player when nearby
- ✅ State: `'face_player'` or `'idle'`
- ✅ Patrol enabled: `false`

**After "Start patrolling"**:
- ✅ Tag `#patrol_mode:on` processed
- ✅ NPC starts moving after conversation ends
- ✅ State changes to `'patrol'`
- ✅ Uses walk animations
- ✅ Patrol enabled: `true`

**After "Stop patrolling"**:
- ✅ Tag `#patrol_mode:off` processed
- ✅ NPC stops moving
- ✅ Returns to idle/face player behavior
- ✅ Patrol enabled: `false`

**Debug**:
```javascript
const behavior = window.npcBehaviorManager.getBehavior('patrol_initially_disabled');
console.log('Patrol enabled:', behavior.config.patrol.enabled);
console.log('Current state:', behavior.currentState);
```

---

## Performance Testing

### Test: Multiple Patrolling NPCs

**Procedure**:
1. Load test scenario (9 NPCs, 8 patrolling)
2. Let all NPCs patrol simultaneously
3. Monitor FPS and performance

**Expected Performance**:
- ✅ Stable 60 FPS with 8 patrolling NPCs
- ✅ No visible lag or stuttering
- ✅ Smooth animations for all NPCs
- ✅ CPU usage reasonable (<20% spike)

**Debug**:
```javascript
// Monitor FPS
let lastTime = performance.now();
let frames = 0;
setInterval(() => {
    const now = performance.now();
    const fps = frames / ((now - lastTime) / 1000);
    console.log('FPS:', fps.toFixed(1));
    frames = 0;
    lastTime = now;
}, 1000);
window.game.scene.scenes[0].events.on('postupdate', () => frames++);
```

---

## Animation Testing

### Expected Animation States

**While Patrolling**:
- Animation: `npc-{npcId}-walk-{direction}`
- Direction: Matches movement vector
- Frame rate: 8 fps
- FlipX: true for left-facing directions

**When Reaching Target**:
- Brief moment at target (< 8px)
- May show idle frame for 1 frame
- Quickly picks new target and resumes walking

**When Blocked**:
- Walk animation continues briefly
- After 500ms stuck timeout, picks new direction
- Changes to new walk animation

### Debug Animations

```javascript
const sprite = window.npcManager.npcs.get('patrol_basic')._sprite;
console.log('Current animation:', sprite.anims.currentAnim?.key);
console.log('Is playing:', sprite.anims.isPlaying);
console.log('FlipX:', sprite.flipX);
```

---

## Edge Cases

### Edge Case 1: Target Point on Wall

**Scenario**: Random target is inside a wall

**Expected**:
- NPC walks toward target
- Hits wall, becomes blocked
- Stuck timer triggers after 500ms
- New target chosen (likely not in wall)
- ✅ No infinite loop

### Edge Case 2: NPC Starts Outside Bounds

**Scenario**: NPC spawned outside configured patrol bounds

**Handling**:
- Bounds auto-expand to include starting position (implemented in parseConfig)
- ✅ NPC patrols normally
- ✅ Console warning logged

**Test**:
```javascript
// Check if bounds were expanded
const behavior = window.npcBehaviorManager.getBehavior('patrol_basic');
const sprite = window.npcManager.npcs.get('patrol_basic')._sprite;
console.log('Start pos:', sprite.x, sprite.y);
console.log('Bounds:', behavior.config.patrol.worldBounds);
// Bounds should include start position
```

### Edge Case 3: Very Small Bounds

**Scenario**: Bounds smaller than NPC sprite

**Expected**:
- NPC still picks targets within bounds
- May appear to jitter if bounds very tiny
- Should not crash

### Edge Case 4: Reached Target Exactly

**Scenario**: NPC reaches within 8px of target

**Expected**:
- ✅ New target chosen immediately
- ✅ No stopping at target (seamless transition)
- ✅ Direction changes smoothly

### Edge Case 5: Direction Change During Collision

**Scenario**: Direction interval expires while NPC is stuck

**Expected**:
- ✅ New target chosen
- ✅ Stuck timer resets
- ✅ NPC attempts to move to new target
- ✅ If still blocked, stuck timer continues

---

## Common Issues

### Issue 1: NPC Not Moving

**Symptoms**: NPC stationary, not patrolling

**Possible Causes**:
1. Patrol disabled: `behavior.config.patrol.enabled === false`
2. No bounds configured: `behavior.config.patrol.worldBounds === null`
3. Higher priority behavior active (face player, personal space)
4. NPC stuck permanently (rare)

**Debug**:
```javascript
const behavior = window.npcBehaviorManager.getBehavior('npc_id');
console.log('Patrol enabled:', behavior.config.patrol.enabled);
console.log('Bounds:', behavior.config.patrol.worldBounds);
console.log('Current state:', behavior.currentState);
console.log('Patrol target:', behavior.patrolTarget);
```

**Fix**:
- Enable patrol: `window.npcGameBridge.setNPCPatrol('npc_id', true)`
- Check state priority

---

### Issue 2: NPC Leaving Bounds

**Symptoms**: NPC wanders outside configured area

**Possible Causes**:
1. Bounds in room coordinates, not world coordinates
2. Bounds calculation error
3. Collision pushing NPC out

**Debug**:
```javascript
const behavior = window.npcBehaviorManager.getBehavior('npc_id');
const sprite = window.npcManager.npcs.get('npc_id')._sprite;
const bounds = behavior.config.patrol.worldBounds;
console.log('NPC pos:', sprite.x, sprite.y);
console.log('Bounds:', bounds);
console.log('In bounds?',
    sprite.x >= bounds.x && sprite.x <= bounds.x + bounds.width &&
    sprite.y >= bounds.y && sprite.y <= bounds.y + bounds.height
);
```

**Note**: Bounds are converted to world coordinates in parseConfig()

---

### Issue 3: NPC Getting Stuck

**Symptoms**: NPC stops moving for >1 second

**Possible Causes**:
1. Stuck in corner with bad target
2. Collision not resolving properly
3. Stuck detection not working

**Debug**:
```javascript
const behavior = window.npcBehaviorManager.getBehavior('npc_id');
const sprite = window.npcManager.npcs.get('npc_id')._sprite;
console.log('Blocked:', sprite.body.blocked);
console.log('Stuck timer:', behavior.stuckTimer);
console.log('Target:', behavior.patrolTarget);
```

**Expected**: Stuck timer should reach 500ms and reset

---

### Issue 4: Wrong Animation

**Symptoms**: Walk animation doesn't match direction

**Possible Causes**:
1. Direction calculation error
2. Animation not created (using fallback idle)
3. FlipX not applied for left directions

**Debug**:
```javascript
const behavior = window.npcBehaviorManager.getBehavior('npc_id');
const sprite = window.npcManager.npcs.get('npc_id')._sprite;
console.log('Direction:', behavior.direction);
console.log('Animation:', sprite.anims.currentAnim?.key);
console.log('FlipX:', sprite.flipX);
console.log('Velocity:', sprite.body.velocity);
```

---

## Success Criteria

✅ **Phase 3 Complete When**:

1. [ ] Basic patrol works (random movement in bounds)
2. [ ] Speed variations work correctly (fast/slow)
3. [ ] Direction changes occur at configured intervals
4. [ ] NPCs stay within configured bounds
5. [ ] Stuck detection recovers from collisions
6. [ ] Narrow area patrols work (corridors)
7. [ ] Patrol + face player interaction works
8. [ ] Small area patrol works without jittering
9. [ ] Patrol can be toggled via Ink tags
10. [ ] Walk animations match movement direction
11. [ ] Performance acceptable with 8+ patrolling NPCs
12. [ ] No console errors during patrol
13. [ ] Edge cases handled gracefully

---

## Next Steps

After Phase 3:
- **Phase 4**: Personal Space behavior testing
- **Phase 5**: Ink integration testing
- **Phase 6**: Hostile visual feedback

---

**Document Status**: Test Guide v1.0
**Last Updated**: 2025-11-09
**Phase**: 3 - Patrol Behavior Testing
