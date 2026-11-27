# Testing NPC Collision Avoidance

## Quick Start

1. Open the game at: `http://localhost:8000/scenario_select.html`
2. Select `test-npc-waypoints.json` from the scenario dropdown
3. Watch the NPCs patrol on their waypoints
4. When two NPCs collide, you should see:
   - NPCs move 5px apart (slightly visible)
   - Console shows collision avoidance logs
   - NPCs recalculate their paths
   - NPCs continue toward their waypoints

## What to Look For

### Expected Behavior

**When NPCs collide during waypoint patrol:**

```
✅ NPCs stay visible (no disappearing)
✅ NPCs don't overlap significantly
✅ NPCs pause briefly when colliding
✅ NPCs resume patrol toward their waypoint
✅ Console shows logs like:
   ⬆️ [npc_id] Bumped into other_npc, moved NE...
   🔄 [npc_id] Recalculating path...
   ✅ [npc_id] Recalculated path...
```

### Debug View

Open browser DevTools Console (F12) and look for logs:

```
⬆️ [waypoint_rectangle] Bumped into waypoint_triangle, moved NE by ~5px from (128.0, 80.0) to (124.5, 76.5)
🔄 [waypoint_rectangle] Recalculating path to waypoint after collision avoidance
✅ [waypoint_rectangle] Recalculated path with 3 waypoints after collision
```

## Test Scenarios in test-npc-waypoints.json

### 1. Rectangle Patrol (Sequential)
- **NPC**: `waypoint_rectangle`
- **Pattern**: Square path (3,3) → (7,3) → (7,7) → (3,7) → repeat
- **Speed**: 100 px/s
- **Mode**: Sequential waypoints

### 2. Triangle Patrol (Random)
- **NPC**: `waypoint_triangle`  
- **Pattern**: Random waypoint selection from 3 points
- **Speed**: 100 px/s
- **Mode**: Random waypoints
- **Collision likelihood**: MEDIUM (crosses rectangle path)

### 3. Checkpoint Patrol (With Dwell)
- **NPC**: `waypoint_with_dwell`
- **Pattern**: Stops at waypoints for 2000ms or 1000ms
- **Speed**: 60 px/s
- **Special**: Tests collision while dwelling
- **Collision likelihood**: MEDIUM

### 4-6. Other Patrol Types
- Fast, slow, and angled patrols
- Test various speeds and angles

## Manual Collision Test

To deliberately cause NPCs to collide:

1. **Observe patrol paths** for the first 5-10 seconds
2. **Identify crossing points** where two NPC paths intersect
3. **Wait for collision** as NPCs reach the intersection
4. **Watch console** for avoidance logs

**Example collision scenario**:
- `waypoint_rectangle` moves right from (3,3) to (7,3)
- `waypoint_triangle` moves to one of its random waypoints
- If triangle chooses waypoint at (8,3), it crosses rectangle's path
- At intersection: collision triggers, both move away, recalculate paths

## Console Debugging Commands

Run these in browser console (F12) while game is running:

### Check all NPC states:
```javascript
window.npcBehaviorManager?.behaviors.forEach((b, id) => {
  console.log(`${id}: state=${b.currentState}, needsRecalc=${b._needsPathRecalc}`);
});
```

### Check specific NPC's patrol target:
```javascript
window.npcBehaviorManager?.getBehavior('waypoint_rectangle')?.patrolTarget
// Output: {x: 112, y: 96, dwellTime: 0}
```

### Check if collisions are set up:
```javascript
// Look for logs at game start like:
// "👥 NPC waypoint_rectangle: 2 NPC-to-NPC collision(s) set up with avoidance"
```

### Force a collision test (manual):
```javascript
// Teleport one NPC on top of another
const npc1 = window.game.physics.world.bodies.entries.find(b => b.gameObject?.npcId === 'waypoint_rectangle');
if (npc1) npc1.gameObject.setPosition(npc1.gameObject.x + 5, npc1.gameObject.y);
```

## Performance Monitoring

The collision avoidance should have minimal performance impact:

- **Collision detection**: Handled by Phaser physics (standard performance)
- **Path recalculation**: ~1-5ms per collision (EasyStar is fast)
- **Movement**: 5px is imperceptible, no animation overhead

**Monitor FPS**:
- Open DevTools Performance tab
- Watch game running with multiple NPC collisions
- FPS should remain stable (60 FPS or close to game's target)

## Troubleshooting

### No collision logs appearing

**Problem**: Collisions not triggering

**Check**:
1. Are NPCs on the same room? (Check `roomId` in behavior)
2. Do NPCs have patrol.enabled=true? (Check NPC config)
3. Do NPC paths actually cross? (Observe positions)
4. Are NPC physics bodies created? (Check sprite.body exists)

**Test**:
```javascript
window.pathfindingManager?.grids.get('test_waypoint_patrol') // Should exist
```

### NPCs getting stuck after collision

**Problem**: NPCs not resuming patrol after collision

**Check**:
1. Path recalculation messages in console?
2. Is new path valid? (console shows "Recalculated path")
3. Can target waypoint be reached? (not blocked)

**Debug**:
```javascript
const behavior = window.npcBehaviorManager?.getBehavior('waypoint_rectangle');
console.log('Path:', behavior?.currentPath);
console.log('PathIndex:', behavior?.pathIndex);
console.log('PatrolTarget:', behavior?.patrolTarget);
```

### NPCs overlapping significantly

**Problem**: 5px movement not sufficient to separate

**Note**: This is rare. The physics engine prevents hard overlap:
- NPCs have collision bodies
- Physics engine pushes them apart automatically
- 5px is additional "nudge" to help them separate faster
- Overlap should be minimal (<5px during collision)

**Verify physics bodies**:
```javascript
window.game.physics.world.bodies.entries
  .filter(b => b.gameObject?.npcId)
  .forEach(b => console.log(b.gameObject.npcId, {x: b.x, y: b.y, width: b.width, height: b.height}));
```

### Path recalculation failing repeatedly

**Problem**: `⚠️ Path recalculation failed` messages

**Causes**:
1. Target waypoint is unreachable from new position
2. NPC is stuck in a corner
3. Pathfinding grid is corrupt

**Fix**:
- Check if waypoint is in valid patrol area
- Verify walls don't block all paths
- Restart game if grid issue

## Expected Results

After implementing collision avoidance, you should see:

✅ **Collision detection working**: Logs appear when NPCs collide  
✅ **Avoidance behavior active**: NPCs move 5px northeast  
✅ **Path recalculation working**: New paths calculated immediately  
✅ **Seamless resumption**: NPCs continue patrol without getting stuck  
✅ **Multiple collisions handled**: Works when >2 NPCs in same area  
✅ **No performance regression**: FPS remains stable  

## Summary

The NPC collision avoidance system is **working correctly** if:

1. NPCs collide (observe overlapping during patrol)
2. Console shows avoidance logs
3. NPCs separate and resume patrol
4. No console errors or warnings
5. Game continues running smoothly

Test with `test-npc-waypoints.json` scenario for best results!
