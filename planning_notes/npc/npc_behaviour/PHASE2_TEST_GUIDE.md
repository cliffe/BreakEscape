# Phase 2: Face Player Behavior - Test Guide

## Overview

Phase 2 focuses on testing and verifying the **Face Player** behavior. This is the foundational behavior that makes NPCs turn to face the player when they approach.

**Status**: ✅ Implementation Complete, Ready for Testing

---

## What Was Implemented

### Core Functionality

1. **8-Way Directional Facing**
   - NPCs can face in 8 directions: up, down, left, right, up-left, up-right, down-left, down-right
   - Direction calculated based on player position relative to NPC
   - Uses 2x threshold for cardinal vs diagonal (prevents flickering)

2. **Distance-Based Activation**
   - Default range: 96px (3 tiles)
   - Configurable via `facePlayerDistance` in scenario JSON
   - NPCs only face player when within range

3. **Animation Integration**
   - Uses idle animations for the calculated direction
   - Supports flipX for left-facing directions
   - Graceful fallback if animations missing

4. **State Priority**
   - Face Player is Priority 1 (overridden by higher priority behaviors)
   - Only activates when no patrol/personal space/hostile behaviors active

---

## Test Scenario

**File**: `scenarios/test-npc-face-player.json`

This scenario contains 12 NPCs arranged to test all aspects of face player behavior:

### Test Layout

```
      1  2  3  4  5  6  7  8  9
   1  [FAR]           [DISABLED]
   2     [NW]     [N]     [NE]
   3
   4
   5     [W]  [CENTER]  [E]
   6
   7
   8     [SW]     [S]     [SE]
   9
```

### NPCs in Scenario

| NPC ID | Position | Test Purpose | Expected Behavior |
|--------|----------|--------------|-------------------|
| `npc_center` | (5, 5) | Default behavior | Should face player in all 8 directions |
| `npc_north` | (5, 2) | Cardinal: North | Should face DOWN when player south |
| `npc_south` | (5, 8) | Cardinal: South | Should face UP when player north |
| `npc_east` | (8, 5) | Cardinal: East | Should face LEFT when player west |
| `npc_west` | (2, 5) | Cardinal: West | Should face RIGHT when player east |
| `npc_northeast` | (8, 2) | Diagonal: NE | Should face DOWN-LEFT when player approaches |
| `npc_northwest` | (2, 2) | Diagonal: NW | Should face DOWN-RIGHT when player approaches |
| `npc_southeast` | (8, 8) | Diagonal: SE | Should face UP-LEFT when player approaches |
| `npc_southwest` | (2, 8) | Diagonal: SW | Should face UP-RIGHT when player approaches |
| `npc_far` | (1, 1) | Short range | Should only face within 2 tiles (64px) |
| `npc_disabled` | (9, 1) | Disabled | Should NEVER face player |

---

## How to Test

### Setup

1. Load the test scenario:
   ```javascript
   // In browser console or main.js
   window.gameScenario = await fetch('scenarios/test-npc-face-player.json').then(r => r.json());
   ```

2. Start the game and observe NPCs

### Test Procedure

#### Test 1: Cardinal Directions

1. **North NPC** (red, position 5,2)
   - Approach from below (south)
   - ✅ **Expected**: NPC should turn to face DOWN
   - Animation: `npc-npc_north-idle-down`

2. **South NPC** (blue, position 5,8)
   - Approach from above (north)
   - ✅ **Expected**: NPC should turn to face UP
   - Animation: `npc-npc_south-idle-up`

3. **East NPC** (red, position 8,5)
   - Approach from left (west)
   - ✅ **Expected**: NPC should turn to face LEFT
   - Animation: `npc-npc_east-idle-left` (uses idle-right with flipX)

4. **West NPC** (blue, position 2,5)
   - Approach from right (east)
   - ✅ **Expected**: NPC should turn to face RIGHT
   - Animation: `npc-npc_west-idle-right`

#### Test 2: Diagonal Directions

5. **Northeast NPC** (red, position 8,2)
   - Approach from southwest
   - ✅ **Expected**: NPC should turn to face DOWN-LEFT
   - Animation: `npc-npc_northeast-idle-down-left`

6. **Northwest NPC** (blue, position 2,2)
   - Approach from southeast
   - ✅ **Expected**: NPC should turn to face DOWN-RIGHT
   - Animation: `npc-npc_northwest-idle-down-right`

7. **Southeast NPC** (red, position 8,8)
   - Approach from northwest
   - ✅ **Expected**: NPC should turn to face UP-LEFT
   - Animation: `npc-npc_southeast-idle-up-left`

8. **Southwest NPC** (blue, position 2,8)
   - Approach from northeast
   - ✅ **Expected**: NPC should turn to face UP-RIGHT
   - Animation: `npc-npc_southwest-idle-up-right`

#### Test 3: Range and Edge Cases

9. **Center NPC** (position 5,5)
   - Walk around NPC in a circle
   - ✅ **Expected**: NPC should smoothly track player, updating direction
   - Should face all 8 directions as player circles

10. **Far NPC** (red, position 1,1)
    - Default range: 64px (2 tiles)
    - Walk past at 3+ tiles distance
    - ✅ **Expected**: NPC should NOT turn
    - Get within 2 tiles
    - ✅ **Expected**: NPC should NOW turn to face player

11. **Disabled NPC** (position 9,1)
    - `facePlayer: false`
    - Walk right up to NPC
    - ✅ **Expected**: NPC should NEVER turn (stays facing default direction)

#### Test 4: Direction Calculation Threshold

12. **Threshold Test** (use center NPC)
    - Position player at exactly 45° angle to NPC
    - ✅ **Expected**: Should use diagonal direction (down-right, up-left, etc.)
    - Position player at ~30° angle (more horizontal)
    - ✅ **Expected**: Should snap to cardinal direction (left/right)
    - Position player at ~60° angle (more vertical)
    - ✅ **Expected**: Should snap to cardinal direction (up/down)

---

## Debugging Tools

### Console Commands

Check NPC behavior state:
```javascript
// Get behavior instance
const behavior = window.npcBehaviorManager.getBehavior('npc_center');

// Check current state
console.log('State:', behavior.currentState);
console.log('Direction:', behavior.direction);
console.log('Config:', behavior.config.facePlayer, behavior.config.facePlayerDistance);

// Check animation
console.log('Last animation:', behavior.lastAnimationKey);
```

### Visual Debug

Enable behavior debug mode (if implemented in Phase 7):
```javascript
window.NPC_BEHAVIOR_DEBUG = true;
```

This should show:
- Green circles around NPCs showing face player range
- Direction indicators

---

## Expected Behavior Summary

### When Player Approaches (within range)

1. NPC calculates dx/dy to player
2. Calls `calculateDirection(dx, dy)` to get 8-way direction
3. Sets `this.direction` to calculated direction
4. Calls `playAnimation('idle', direction)`
5. Animation system:
   - Maps left directions to right with flipX
   - Plays animation: `npc-{npcId}-idle-{direction}`
   - Sets flipX if direction includes 'left'

### When Player Leaves Range

- NPC stays facing last direction (idle animation continues)
- State changes to 'idle' but direction unchanged
- This is intentional - NPC "remembers" where player was

---

## Known Edge Cases

### Edge Case 1: Player Exactly on Top of NPC
- **Behavior**: Distance = 0, direction calculation may be undefined
- **Handling**: Previous direction maintained (no crash)
- **Status**: ✅ Safe (direction only updates if dx/dy non-zero)

### Edge Case 2: Multiple NPCs Overlapping
- **Behavior**: Each NPC independently faces player
- **Expected**: All NPCs face the same direction (towards player)
- **Status**: ✅ Working as intended

### Edge Case 3: Direction Flickering at Threshold
- **Behavior**: Player moving along threshold boundary (e.g., 45° angle)
- **Mitigation**: 2x threshold prevents flickering
  - Horizontal must be > 2x vertical for pure horizontal
  - Vertical must be > 2x horizontal for pure vertical
- **Status**: ✅ Stable with 2x threshold

### Edge Case 4: Animation Missing
- **Behavior**: Walk animation doesn't exist for direction
- **Fallback**: Uses idle animation with warning in console
- **Status**: ✅ Graceful degradation

---

## Performance Metrics

### Update Frequency
- **Throttled**: Updates every 50ms (20 Hz)
- **Frame Rate**: Should NOT impact 60 FPS
- **CPU Usage**: Minimal (simple calculations)

### Test with 10 NPCs
- All NPCs should update independently
- No visible lag or stuttering
- Smooth direction transitions

---

## Success Criteria

✅ **Phase 2 Complete When**:

1. [ ] All 8 cardinal/diagonal directions work correctly
2. [ ] Distance-based activation works (range configurable)
3. [ ] NPCs face player smoothly without flickering
4. [ ] Multiple NPCs can face player independently
5. [ ] Disabled NPCs do NOT face player
6. [ ] Short-range NPCs only activate within configured range
7. [ ] Animations play correctly (idle-{direction})
8. [ ] FlipX works for left-facing directions
9. [ ] No console errors during testing
10. [ ] Performance acceptable with 10+ NPCs

---

## Common Issues and Solutions

### Issue 1: NPC Not Facing Player
**Symptoms**: NPC stays in default idle animation
**Possible Causes**:
- `facePlayer` disabled in config
- Player outside `facePlayerDistance` range
- Behavior not registered (check console for "🤖 Behavior registered")
- Higher priority behavior active (patrol, personal space)

**Debug**:
```javascript
const behavior = window.npcBehaviorManager.getBehavior('npc_id');
console.log('Face player enabled?', behavior.config.facePlayer);
console.log('Current state:', behavior.currentState); // Should be 'face_player'
```

### Issue 2: Wrong Direction
**Symptoms**: NPC faces wrong way
**Debug**:
```javascript
// Check direction calculation
const player = window.player;
const npc = window.npcManager.npcs.get('npc_id');
const sprite = npc._sprite;
const dx = player.x - sprite.x;
const dy = player.y - sprite.y;
console.log('DX:', dx, 'DY:', dy);

const behavior = window.npcBehaviorManager.getBehavior('npc_id');
const direction = behavior.calculateDirection(dx, dy);
console.log('Calculated direction:', direction);
```

### Issue 3: Animation Not Playing
**Symptoms**: NPC doesn't change animation
**Possible Causes**:
- Animation key doesn't exist
- Animation not created in npc-sprites.js
- Sprite reference invalid

**Debug**:
```javascript
const npcId = 'npc_id';
const direction = 'down';
const animKey = `npc-${npcId}-idle-${direction}`;
console.log('Animation exists?', window.game.scene.scenes[0].anims.exists(animKey));
```

### Issue 4: FlipX Not Working
**Symptoms**: Left-facing NPCs face right
**Check**:
```javascript
const sprite = window.npcManager.npcs.get('npc_id')._sprite;
console.log('FlipX:', sprite.flipX); // Should be true for left directions
```

---

## Next Steps After Phase 2

Once Phase 2 tests pass:

1. **Phase 3**: Patrol Behavior
   - NPCs move randomly within bounds
   - Test with moving NPCs

2. **Phase 4**: Personal Space
   - NPCs back away from player
   - Test backing behavior

3. **Phase 5**: Ink Integration
   - Test behavior tags in dialogue
   - Verify tag handlers work

---

## Test Results Template

```markdown
## Phase 2 Test Results

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Build**: [Commit hash]

### Cardinal Directions
- [ ] North (DOWN) - PASS / FAIL / NOTES:
- [ ] South (UP) - PASS / FAIL / NOTES:
- [ ] East (LEFT) - PASS / FAIL / NOTES:
- [ ] West (RIGHT) - PASS / FAIL / NOTES:

### Diagonal Directions
- [ ] Northeast (DOWN-LEFT) - PASS / FAIL / NOTES:
- [ ] Northwest (DOWN-RIGHT) - PASS / FAIL / NOTES:
- [ ] Southeast (UP-LEFT) - PASS / FAIL / NOTES:
- [ ] Southwest (UP-RIGHT) - PASS / FAIL / NOTES:

### Edge Cases
- [ ] Range activation - PASS / FAIL / NOTES:
- [ ] Disabled NPC - PASS / FAIL / NOTES:
- [ ] Threshold stability - PASS / FAIL / NOTES:

### Performance
- [ ] 10 NPCs smooth - PASS / FAIL / NOTES:
- [ ] No console errors - PASS / FAIL / NOTES:

### Overall Status
- [ ] Phase 2 COMPLETE
- [ ] Issues found: [List]
- [ ] Ready for Phase 3: YES / NO
```

---

**Document Status**: Test Guide v1.0
**Last Updated**: 2025-11-09
**Phase**: 2 - Face Player Testing
