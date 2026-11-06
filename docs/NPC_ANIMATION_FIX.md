# NPC Animation Fix - Single Frame Issue

## Problem

NPCs were stuck on a single frame and not playing any animations, appearing completely static even when they should have been playing breathing-idle or walk animations.

## Root Cause

The code was checking `sprite.anims.exists(animKey)` instead of `scene.anims.exists(animKey)`.

### The Bug

In Phaser 3:
- **`scene.anims`** - The scene's animation manager (where animations are registered globally)
- **`sprite.anims`** - The sprite's animation component (handles playing animations on that sprite)

The bug was using `sprite.anims.exists()` which checks if an animation is currently assigned to the sprite, not whether the animation exists in the animation manager.

### Affected Code Locations

1. **`createNPCSprite()`** - Initial animation not playing
2. **`playNPCAnimation()`** - Helper function not finding animations
3. **`returnNPCToIdle()`** - NPCs not returning to idle

## Solution

Changed all animation existence checks from `sprite.anims.exists()` to `scene.anims.exists()`.

### Location 1: NPC Creation (`createNPCSprite`)

**Before:**
```javascript
const idleAnimKey = `npc-${npc.id}-idle`;
if (sprite.anims.exists(idleAnimKey)) {  // ❌ WRONG
    sprite.play(idleAnimKey, true);
}
```

**After:**
```javascript
const idleAnimKey = `npc-${npc.id}-idle`;
if (scene.anims.exists(idleAnimKey)) {  // ✅ CORRECT
    sprite.play(idleAnimKey, true);
}
```

### Location 2: Play Animation Helper (`playNPCAnimation`)

**Before:**
```javascript
export function playNPCAnimation(sprite, animKey) {
    if (!sprite || !sprite.anims) {
        return false;
    }
    
    if (sprite.anims.exists(animKey)) {  // ❌ WRONG
        sprite.play(animKey);
        return true;
    }
    return false;
}
```

**After:**
```javascript
export function playNPCAnimation(sprite, animKey) {
    if (!sprite || !sprite.anims || !sprite.scene) {
        return false;
    }
    
    if (sprite.scene.anims.exists(animKey)) {  // ✅ CORRECT
        sprite.play(animKey);
        return true;
    }
    return false;
}
```

### Location 3: Return to Idle (`returnNPCToIdle`)

**Before:**
```javascript
export function returnNPCToIdle(sprite, npcId) {
    if (!sprite) return;
    
    const idleKey = `npc-${npcId}-idle`;
    if (sprite.anims.exists(idleKey)) {  // ❌ WRONG
        sprite.play(idleKey, true);
    }
}
```

**After:**
```javascript
export function returnNPCToIdle(sprite, npcId) {
    if (!sprite || !sprite.scene) return;
    
    const idleKey = `npc-${npcId}-idle`;
    if (sprite.scene.anims.exists(idleKey)) {  // ✅ CORRECT
        sprite.play(idleKey, true);
    }
}
```

## Phaser 3 Animation Architecture

### Scene Animation Manager (`scene.anims`)
- **Purpose**: Global repository of animation definitions
- **Scope**: All sprites in the scene can use these animations
- **Created by**: `scene.anims.create()`
- **Checked by**: `scene.anims.exists(key)`

```javascript
// Create animation in scene
scene.anims.create({
    key: 'npc-sarah-idle-down',
    frames: [...],
    frameRate: 6,
    repeat: -1
});

// Check if animation exists
if (scene.anims.exists('npc-sarah-idle-down')) {
    // Animation is registered
}
```

### Sprite Animation Component (`sprite.anims`)
- **Purpose**: Controls playback on individual sprite
- **Scope**: Only affects this specific sprite
- **Methods**: `play()`, `stop()`, `pause()`, `resume()`
- **Properties**: `currentAnim`, `isPlaying`, `frameRate`

```javascript
// Play animation on sprite
sprite.play('npc-sarah-idle-down');

// Check what's currently playing
if (sprite.anims.isPlaying) {
    console.log(sprite.anims.currentAnim.key);
}
```

## Impact

### Before Fix
❌ NPCs appeared completely frozen  
❌ No breathing animation  
❌ No walk animation during patrol  
❌ No directional facing  
❌ Looked like static images  

### After Fix
✅ NPCs play breathing-idle animation  
✅ Walk animations work during patrol  
✅ Proper 8-directional animations  
✅ Smooth animation transitions  
✅ Characters look alive and polished  

## Testing

Verified across all NPC behaviors:
- ✅ Initial idle animation on spawn
- ✅ Walk animation during patrol
- ✅ Idle animation when standing still
- ✅ Face player animation
- ✅ Chase animation (hostile NPCs)
- ✅ Return to idle after movement

## Why This Bug Was Subtle

1. **No console errors**: `sprite.anims.exists()` is a valid method, it just checks the wrong thing
2. **Silent failure**: The `if` condition simply evaluated to `false`, so no animation played
3. **Sprite still visible**: The NPC appeared on screen, just frozen on first frame
4. **Misleading**: The method name `exists()` sounds like it checks if animation exists globally

## Prevention

### Code Review Checklist
- [ ] Animation checks use `scene.anims.exists()` not `sprite.anims.exists()`
- [ ] Sprite has access to scene (`sprite.scene`)
- [ ] Animation keys match exactly (case-sensitive)
- [ ] Animations are created before being played

### Common Mistakes to Avoid

**❌ Wrong:**
```javascript
if (sprite.anims.exists('idle')) { ... }
if (this.sprite.anims.exists('walk')) { ... }
```

**✅ Correct:**
```javascript
if (scene.anims.exists('idle')) { ... }
if (this.scene.anims.exists('walk')) { ... }
if (sprite.scene.anims.exists('idle')) { ... }
```

## Related Documentation

- Phaser 3 Animation Manager: https://photonstorm.github.io/phaser3-docs/Phaser.Animations.AnimationManager.html
- Phaser 3 Sprite Animation: https://photonstorm.github.io/phaser3-docs/Phaser.GameObjects.Components.Animation.html

## Files Modified

- `public/break_escape/js/systems/npc-sprites.js`
  - `createNPCSprite()` - Line 65
  - `playNPCAnimation()` - Line 483
  - `returnNPCToIdle()` - Line 501

## Commit Message

```
Fix NPC animations stuck on single frame

NPCs were not playing any animations due to incorrect animation 
existence checks. Changed from sprite.anims.exists() to 
scene.anims.exists() in three locations:
- createNPCSprite() - Initial idle animation
- playNPCAnimation() - Helper function
- returnNPCToIdle() - Return to idle state

Now NPCs properly play breathing-idle and walk animations.
```
