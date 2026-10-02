# NPC Line-of-Sight (LOS) System Documentation

## Overview

The NPC Line-of-Sight (LOS) system allows NPCs to detect the player and events (like lockpicking) only when the player is within a configurable vision cone. This adds realism to NPC perception and prevents event triggering when NPCs can't "see" the player.

## Configuration

### NPC JSON Structure

Add a `los` property to any NPC definition:

```json
{
  "id": "security_guard",
  "npcType": "person",
  "los": {
    "enabled": true,
    "range": 300,
    "angle": 140,
    "visualize": false
  },
  "eventMappings": [
    {
      "eventPattern": "lockpick_used_in_view",
      "targetKnot": "on_lockpick_used",
      "conversationMode": "person-chat",
      "cooldown": 0
    }
  ]
}
```

### LOS Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | boolean | true | Whether LOS detection is active |
| `range` | number | 300 | Detection range in pixels |
| `angle` | number | 120 | Field of view angle in degrees (120° = 60° on each side of facing direction) |
| `visualize` | boolean | false | Whether to render the LOS cone for debugging |

## How It Works

### Detection Algorithm

1. **Distance Check**: Player must be within `range` pixels of NPC
2. **Angle Check**: Player must be within `angle` degrees of NPC's facing direction
3. **Both conditions required**: Player must satisfy both distance AND angle constraints

### Facing Direction

The system automatically detects NPC facing direction from:
1. Explicit `facingDirection` property (if set on NPC instance)
2. Sprite rotation (converted from radians to degrees)
3. Direction property (0=down, 1=left, 2=up, 3=right)
4. Default: 270° (facing up)

For NPCs with patrol routes, the facing direction updates based on current movement direction.

## Implementation Details

### Files

- **`js/systems/npc-los.js`** - Core LOS detection and visualization
  - `isInLineOfSight(npc, target, losConfig)` - Check if target is in LOS
  - `drawLOSCone(scene, npc, losConfig)` - Render debug visualization
  - `clearLOSCone(graphics)` - Clean up graphics

- **`js/systems/npc-manager.js`** - NPC manager integration
  - `shouldInterruptLockpickingWithPersonChat(roomId, playerPosition)` - Check if any NPC can see the player attempting to lockpick
  - `setLOSVisualization(enable, scene)` - Toggle LOS cone rendering
  - `updateLOSVisualizations(scene)` - Update cone graphics (call from game loop)

- **`js/systems/unlock-system.js`** - Integration with lock system
  - Passes player position when checking for NPC interruption

### Integration with Lockpicking

When a player attempts to lockpick:

```javascript
// unlock-system.js checks LOS before starting minigame
const playerPos = window.player.sprite.getCenter();
const interruptingNPC = window.npcManager.shouldInterruptLockpickingWithPersonChat(roomId, playerPos);

if (interruptingNPC) {
  // NPC can see player - trigger person-chat instead of lockpicking
  // emit lockpick_used_in_view event
  return; // Don't start lockpicking
}
// Otherwise, proceed with normal lockpicking
```

## Usage

### Checking LOS in Code

```javascript
import { isInLineOfSight } from 'js/systems/npc-los.js';

const losConfig = {
  range: 300,
  angle: 120,
  enabled: true
};

const canSee = isInLineOfSight(npc, playerPosition, losConfig);
if (canSee) {
  console.log('NPC can see player!');
}
```

### Debugging with Visualization

Enable LOS cone rendering to visualize NPC vision:

```javascript
// In console or during game init
window.npcManager.setLOSVisualization(true, window.game.scene.scenes[0]);

// Then call from game loop (in update method)
window.npcManager.updateLOSVisualizations(window.game.scene.scenes[0]);
```

The visualization shows:
- **Green semi-transparent cone** = NPC's field of view
- **Cone origin** = NPC's position
- **Cone angle** = Configured `angle` property
- **Cone range** = Configured `range` property

### Server Migration Notes

Since this system is client-side only, consider:
- **Phase 1** (Current): Client-side LOS checks for cosmetic reactions
- **Phase 2** (Future): Server validates LOS before accepting unlock attempts
- **Migration Path**: Keep client-side system for immediate feedback, server validates actual event

## Testing

### Test Scenario

The file `scenarios/npc-patrol-lockpick.json` includes two NPCs with LOS configured:

```json
"security_guard": {
  "los": {
    "enabled": true,
    "range": 300,
    "angle": 140,
    "visualize": false
  },
  ...
}
```

### Test Cases

1. **In LOS**: Player stands in front of NPC within range → NPC reacts to lockpicking
2. **Out of Range**: Player stands far away → NPC does NOT react
3. **Behind NPC**: Player behind NPC's facing direction → NPC does NOT react
4. **Partial Angle**: Player at edge of FOV cone → Reacts only if within angle bounds

### Running Tests

```javascript
// Enable LOS visualization
window.npcManager.setLOSVisualization(true, window.game.scene.scenes[0]);

// Manually test LOS
const playerPos = window.player.sprite.getCenter();
const security_guard = window.npcManager.getNPC('security_guard');
const canSee = window.npcManager.shouldInterruptLockpickingWithPersonChat('patrol_corridor', playerPos);
console.log('Can NPC see player?', canSee !== null);
```

## Performance Considerations

- **LOS checks**: O(n) where n = number of NPCs in room (very fast)
- **Distance calculation**: Uses Phaser's `Distance.Between()` (optimized)
- **Visualization**: Only enabled for debugging, should be disabled in production
- **Angle calculation**: Minimal overhead, only done when needed

## Common Issues

### Issue: NPC always sees player
- **Check**: Verify `los.enabled: true` in NPC definition
- **Check**: Confirm `range` is large enough for test scenario
- **Check**: Verify `angle` value is correct (should be 120-180 for typical coverage)

### Issue: NPC never sees player
- **Check**: Player position is correct (check `window.player.sprite.getCenter()`)
- **Check**: NPC position is correct
- **Check**: NPC facing direction is correct (check `npc.direction` or `npc.facingDirection`)
- **Debug**: Enable visualization with `setLOSVisualization(true, scene)`

### Issue: Visualization cone not showing
- **Check**: `visualize` property is set to `true` (or always enabled via `setLOSVisualization`)
- **Check**: Scene is passed correctly to `updateLOSVisualizations()`
- **Check**: Call `updateLOSVisualizations()` from game's update loop

## Future Enhancements

1. **Obstacles**: Add wall/terrain blocking for more realistic LOS
2. **Hearing**: Add audio-based detection (separate system)
3. **Memory**: Add NPC memory of recent player sightings
4. **Alert Levels**: Different LOS ranges based on NPC alert state
5. **Dynamic Facing**: Update facing direction based on patrol waypoints
