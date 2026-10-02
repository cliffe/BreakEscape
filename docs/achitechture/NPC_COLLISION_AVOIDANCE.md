# NPC Collision Avoidance System

## Overview

The NPC collision avoidance system handles two types of collisions for patrolling NPCs:

### NPC-to-NPC Collisions
When two NPCs collide with each other during wayfinding (waypoint patrol or random patrol):

1. **Detecting the collision** via Phaser physics callback
2. **Moving the colliding NPC 5px northeast** (diagonal away from typical collision angles)
3. **Recalculating the path** to the current waypoint
4. **Resuming wayfinding** seamlessly

### NPC-to-Player Collisions
When a patrolling NPC collides with the player:

1. **Detecting the collision** via Phaser physics callback
2. **Moving the NPC 5px northeast** away from the player
3. **Recalculating the path** to the current waypoint
4. **Resuming patrol** seamlessly

Both types create natural-looking behavior where NPCs politely move out of the way and continue toward their destinations.

---

## How It Works

### 1. Collision Detection Setup

When an NPC sprite is created, `setupNPCToNPCCollisions()` sets up physics colliders with all other NPCs in the room:

```javascript
// File: js/systems/npc-sprites.js
game.physics.add.collider(
    npcSprite, 
    otherNPC,
    () => {
        // Collision callback executed when NPCs touch
        handleNPCCollision(npcSprite, otherNPC);
    }
);
```

**Important**: Collisions are **one-way** - only the first NPC in the callback gets the avoidance logic. The second NPC will trigger its own collision callback on the next physics update.

### 2. Collision Response (handleNPCCollision)

When a collision is detected:

```javascript
function handleNPCCollision(npcSprite, otherNPC) {
    // 1. Get behavior manager and validate state
    const npcBehavior = window.npcBehaviorManager?.getBehavior(npcSprite.npcId);
    if (!npcBehavior || npcBehavior.currentState !== 'patrol') {
        return; // Only respond if currently patrolling
    }

    // 2. Calculate northeast displacement (~5px total)
    const moveDistance = 5;
    const moveX = -moveDistance / Math.sqrt(2);  // ~-3.5 (northwest)
    const moveY = -moveDistance / Math.sqrt(2);  // ~-3.5 (northeast)
    
    // 3. Apply movement
    npcSprite.setPosition(npcSprite.x + moveX, npcSprite.y + moveY);
    
    // 4. Update depth for correct Y-sorting
    npcBehavior.updateDepth();
    
    // 5. Mark for path recalculation
    npcBehavior._needsPathRecalc = true;
}
```

### 3. Path Recalculation

On the next `updatePatrol()` call, if `_needsPathRecalc` is true:

```javascript
// File: js/systems/npc-behavior.js
updatePatrol(time, delta) {
    if (this._needsPathRecalc && this.patrolTarget) {
        this._needsPathRecalc = false;
        
        // Clear old path
        this.currentPath = [];
        this.pathIndex = 0;
        
        // Request new path from current position to waypoint
        pathfindingManager.findPath(
            this.roomId,
            this.sprite.x,           // Current position (after 5px NE move)
            this.sprite.y,
            this.patrolTarget.x,     // Original waypoint target
            this.patrolTarget.y,
            (path) => { /* update currentPath */ }
        );
        return;
    }
    
    // ... rest of normal patrol logic
}
```

---

## Mathematical Details

### Northeast Movement Calculation

The 5px northeast movement is calculated as:

```
moveX = -5 / √2 ≈ -3.5 pixels (moves left/west)
moveY = -5 / √2 ≈ -3.5 pixels (moves up/north)

Total displacement: √(3.5² + 3.5²) ≈ 5 pixels
Direction: -135° from east = 225° = northwest in standard math, northeast in screen space
```

**Screen space note**: In Phaser/web coordinates, Y increases downward, so:
- Negative X = left/west
- Negative Y = up/north (toward screen top)
- Combined: northwest direction (which appears as northeast relative to NPC positioning)

### Why ~5 pixels?

- **Too small** (<2px): Collisions may re-trigger immediately
- **Too large** (>10px): Movement becomes too noticeable, NPCs jump away
- **~5px**: Visually imperceptible but sufficient to separate physics bodies

---

## NPC-to-Player Collision Avoidance

### How It Works

When a patrolling NPC collides with the player, `handleNPCPlayerCollision()` is triggered:

```javascript
function handleNPCPlayerCollision(npcSprite, player) {
    // 1. Get NPC behavior and validate it's patrolling
    const npcBehavior = window.npcBehaviorManager?.getBehavior(npcSprite.npcId);
    if (!npcBehavior || npcBehavior.currentState !== 'patrol') {
        return; // Only respond if currently patrolling
    }

    // 2. Calculate northeast displacement (~5px total)
    const moveDistance = 7;
    const moveX = -moveDistance / Math.sqrt(2);  // ~-3.5 (northwest)
    const moveY = -moveDistance / Math.sqrt(2);  // ~-3.5 (northeast)
    
    // 3. Apply movement
    npcSprite.setPosition(npcSprite.x + moveX, npcSprite.y + moveY);
    
    // 4. Update depth for correct Y-sorting
    npcBehavior.updateDepth();
    
    // 5. Mark for path recalculation
    npcBehavior._needsPathRecalc = true;
}
```

### Integration with Patrol

When NPC collides with player during patrol:

```
Player standing in NPC's path
    ↓
Collision detected in physics update
    ↓
NPC moves 5px NE away from player
    ↓
Set _needsPathRecalc = true
    ↓
Next frame: updatePatrol() runs
    ↓
Recalculate path from NEW position to SAME waypoint
    ↓
NPC navigates around player and resumes patrol
```

### Setup

The collision callback is configured in `createNPCCollision()`:

```javascript
scene.physics.add.collider(
    npcSprite,
    player,
    () => {
        handleNPCPlayerCollision(npcSprite, player);
    }
);
```

This is called once when each NPC is created, so all patrolling NPCs automatically route around the player.

---

## Behavior Integration

### State Priority

Collision avoidance only triggers when:

1. NPC is in **'patrol' state** (patrolling or waypoint following)
2. Collision callback is executing during physics update
3. (For NPC-to-NPC) Other NPC is not the same sprite

**Not triggered when**:
- NPC is in 'idle' state

- NPC is in 'face_player' state
- NPC is in 'maintain_space' state (personal space takes priority)
- NPC is in 'chase'/'flee' states

### Waypoint Patrol + Collision Avoidance

For waypoint-based patrol:

```
1. Choose waypoint (e.g., tile 15,20)
2. Request path from current position to waypoint
3. Follow path step-by-step
   ↓ [NPC collides with another NPC]
4. Move 5px NE, mark _needsPathRecalc = true
5. Next frame: recalculate path from NEW position to SAME waypoint
6. Continue following new path
7. Eventually reach waypoint (if possible)
8. Move to next waypoint in sequence
```

### Random Patrol + Collision Avoidance

For random patrol:

```
1. Choose random patrol target
2. Request path to target
3. Follow path step-by-step
   ↓ [NPC collides]
4. Move 5px NE, mark _needsPathRecalc = true
5. Next frame: recalculate path from NEW position to SAME target
6. Continue following new path
7. Eventually reach target
8. Choose new random target
```

---

## Console Output

When collision avoidance is triggered, you'll see:

```
⬆️ [npc_guard_1] Bumped into npc_guard_2, moved NE by ~5px from (123.0, 456.0) to (119.5, 452.5)
🔄 [npc_guard_1] Recalculating path to waypoint after collision avoidance
✅ [npc_guard_1] Recalculated path with 8 waypoints after collision
```

**Log meanings**:
- `⬆️ ... Bumped into ...` - Collision detected, NPC moved away
- `🔄 ... Recalculating path ...` - Path being recalculated from new position
- `✅ ... Recalculated path ...` - New path computed successfully
- `⚠️ ... Path recalculation failed ...` - New path couldn't be computed (blocked)

---

## Testing

### Manual Testing

1. **Create test scenario** with multiple NPCs on waypoint patrol
   - Load `test-npc-waypoints.json` or similar
   - Ensure NPCs have patrol.enabled=true and waypoints defined

2. **Observe collision avoidance**:
   - Watch console for collision logs
   - Verify NPCs don't overlap (physics prevents hard collision)
   - Verify NPCs don't get stuck (path recalculation allows movement)

3. **Edge cases to test**:
   - NPCs colliding head-on while patrolling
   - NPCs colliding when one is at waypoint (dwelling)
   - NPCs colliding in narrow corridors
   - Multiple NPCs colliding in sequence

### Debugging

**Check if collision avoidance is working**:

```javascript
// In browser console
window.npcBehaviorManager?.behaviors.forEach((behavior, npcId) => {
    console.log(`${npcId}: state=${behavior.currentState}, _needsPathRecalc=${behavior._needsPathRecalc}`);
});
```

**Verify collision setup**:

```javascript
// Check if setupNPCToNPCCollisions was called
// Look for log message: "👥 NPC npc_id: X NPC-to-NPC collision(s) set up with avoidance"
```

**Check patrol target**:

```javascript
window.npcBehaviorManager?.getBehavior('npc_id')?.patrolTarget
// Should show {x: ..., y: ..., dwellTime: ...}
```

---

## Limitations & Future Improvements

### Current Limitations

1. **One NPC moves**: Only the first NPC in the collision callback moves. The second NPC moves on its next collision callback (asymmetric but works).

2. **Single 5px bump**: Each collision moves NPC exactly 5px NE. If NPCs keep colliding, they keep bumping (rare but possible).

3. **No group avoidance**: System doesn't prevent 3+ NPCs from creating circular collision loops (doesn't happen in practice due to physics dampening).

4. **Path always recalculates**: Even if a better path doesn't exist, we still recalculate (slight performance cost).

### Potential Improvements

- [ ] **Bidirectional avoidance**: Detect collision and move BOTH NPCs slightly away from each other
- [ ] **Smarter direction**: Calculate direction away from other NPC instead of fixed NE
- [ ] **Larger collision buffer**: Use slightly larger physical collision radius for more reactive avoidance
- [ ] **Path prediction**: Check for predicted collisions and adjust paths before they occur
- [ ] **Crowd flow**: Use formation-based movement for coordinated multi-NPC patrols

---

## Code Structure

### Key Files Modified

**`js/systems/npc-sprites.js`**:
- `createNPCCollision()` - Updated to add NPC-to-player collision callback
- `setupNPCToNPCCollisions()` - Updated to add NPC-to-NPC collision callback
- `handleNPCCollision()` - New function, handles NPC-to-NPC collision response
- `handleNPCPlayerCollision()` - New function, handles NPC-to-player collision response

**`js/systems/npc-behavior.js`**:
- `updatePatrol()` - Modified to check `_needsPathRecalc` flag at start

### Related Systems

- **Physics Engine** (Phaser 3): Detects collisions and triggers callbacks
- **Pathfinding** (EasyStar.js): Recalculates paths after avoidance movement
- **Behavior Manager**: Tracks NPC state and executes behaviors
- **Depth Sorting**: Maintains correct Y-sorting after position changes

---

## API Reference

### setupNPCToNPCCollisions(scene, npcSprite, roomId, allNPCSprites)

**Sets up NPC-to-NPC collision detection with automatic avoidance**

```javascript
// Called when creating each NPC sprite
setupNPCToNPCCollisions(scene, npcSprite, 'office_1', [npc1, npc2, npc3]);
```

**Parameters**:
- `scene` (Phaser.Scene): Game scene
- `npcSprite` (Phaser.Sprite): NPC sprite to collide
- `roomId` (string): Room identifier
- `allNPCSprites` (Array): All NPC sprites in room

**Returns**: void

### handleNPCCollision(npcSprite, otherNPC)

**Handles single NPC-to-NPC collision by moving NPC and marking for path recalc**

```javascript
// Called automatically by physics callback
// Don't call directly unless testing
handleNPCCollision(npcSprite1, npcSprite2);
```

**Parameters**:
- `npcSprite` (Phaser.Sprite): NPC that moved away
- `otherNPC` (Phaser.Sprite): Other NPC (stays in place)

**Returns**: void

**Side effects**:
- Modifies `npcSprite.x` and `npcSprite.y` (moves 5px NE)
- Sets `behavior._needsPathRecalc = true`
- Updates depth via `behavior.updateDepth()`
- Logs collision to console

### handleNPCPlayerCollision(npcSprite, player)

**Handles NPC-to-player collision by moving NPC and marking for path recalc**

```javascript
// Called automatically by physics callback
// Don't call directly unless testing
handleNPCPlayerCollision(npcSprite, playerSprite);
```

**Parameters**:
- `npcSprite` (Phaser.Sprite): Patrolling NPC sprite
- `player` (Phaser.Sprite): Player sprite

**Returns**: void

**Side effects**:
- Modifies `npcSprite.x` and `npcSprite.y` (moves 5px NE)
- Sets `behavior._needsPathRecalc = true`
- Updates depth via `behavior.updateDepth()`
- Logs collision to console

````

**Side effects**:
- Modifies `npcSprite.x` and `npcSprite.y` (moves 5px NE)
- Sets `behavior._needsPathRecalc = true`
- Updates depth via `behavior.updateDepth()`
- Logs collision to console

---

## Example Scenario Setup

To test NPC collision avoidance, ensure your scenario has multiple NPCs with patrol enabled:

```json
{
  "npcs": [
    {
      "id": "guard_1",
      "name": "Guard 1",
      "npcType": "guard",
      "roomId": "office_1",
      "position": [120, 150],
      "config": {
        "patrol": {
          "enabled": true,
          "speed": 100,
          "waypoints": [
            {"x": 5, "y": 5},
            {"x": 15, "y": 5},
            {"x": 15, "y": 15},
            {"x": 5, "y": 15}
          ],
          "waypointMode": "sequential"
        }
      }
    },
    {
      "id": "guard_2",
      "name": "Guard 2",
      "npcType": "guard",
      "roomId": "office_1",
      "position": [180, 180],
      "config": {
        "patrol": {
          "enabled": true,
          "speed": 100,
          "waypoints": [
            {"x": 15, "y": 5},
            {"x": 15, "y": 15},
            {"x": 5, "y": 15},
            {"x": 5, "y": 5}
          ],
          "waypointMode": "sequential"
        }
      }
    }
  ]
}
```

---

---

## Summary

The NPC collision avoidance system handles both NPC-to-NPC and NPC-to-player collisions:

### NPC-to-NPC Avoidance
✅ Automatically detects NPC-to-NPC collisions  
✅ Moves colliding NPC 5px northeast  
✅ Recalculates path to current waypoint  
✅ Resumes patrol seamlessly  

### NPC-to-Player Avoidance
✅ Automatically detects NPC-to-player collisions during patrol  
✅ Moves NPC 5px northeast away from player  
✅ Recalculates path to current waypoint  
✅ Resumes patrol around the player  

### Both Collision Types
✅ Work with both waypoint and random patrol modes  
✅ Maintain correct depth sorting  
✅ Log all actions for debugging  
✅ Only trigger during 'patrol' state  

```  

This creates natural-looking NPC behavior where they navigate around each other while maintaining patrol patterns.
