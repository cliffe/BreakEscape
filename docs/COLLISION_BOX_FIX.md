# Collision Box Fix for 80x80 Sprites

## Problem

When switching from 64x64 legacy sprites to 80x80 atlas sprites, the collision boxes at the feet were incorrectly positioned, causing:
- Characters floating above the ground
- Incorrect collision detection
- Misaligned depth sorting

## Root Cause

The collision box offset was hardcoded for 64x64 sprites and not adjusted for the larger 80x80 atlas sprites.

### Legacy Sprite (64x64)
```
Sprite size: 64x64 pixels
Collision box: 15x10 (player) or 18x10 (NPCs)
Offset: (25, 50) for player, (23, 50) for NPCs
```

### Atlas Sprite (80x80)
```
Sprite size: 80x80 pixels
Collision box: 18x10 (player) or 20x10 (NPCs)
Offset: (31, 66) for player, (30, 66) for NPCs
```

## Solution

### Collision Box Calculation

For 80x80 sprites:
- **Width offset**: `(80 - collision_width) / 2` to center horizontally
  - Player: `(80 - 18) / 2 = 31`
  - NPCs: `(80 - 20) / 2 = 30`
  
- **Height offset**: `80 - (collision_height + margin)` to position at feet
  - Both: `80 - 14 = 66` (10px box + 4px margin from bottom)

## Changes Made

### 1. Player System (`js/core/player.js`)

**Before:**
```javascript
// Hardcoded for 64x64
player.body.setSize(15, 10);
player.body.setOffset(25, 50);
```

**After:**
```javascript
const isAtlas = gameInstance.cache.json.exists(playerSprite);

if (isAtlas) {
    // 80x80 sprite - collision box at feet
    player.body.setSize(18, 10);
    player.body.setOffset(31, 66);
} else {
    // 64x64 sprite - legacy collision box
    player.body.setSize(15, 10);
    player.body.setOffset(25, 50);
}
```

### 2. NPC System (`js/systems/npc-sprites.js`)

**Before:**
```javascript
// Hardcoded for 64x64
sprite.body.setSize(18, 10);
sprite.body.setOffset(23, 50);
```

**After:**
```javascript
const isAtlas = scene.cache.json.exists(spriteSheet);

if (isAtlas) {
    // 80x80 sprite - collision box at feet
    sprite.body.setSize(20, 10);
    sprite.body.setOffset(30, 66);
} else {
    // 64x64 sprite - legacy collision box
    sprite.body.setSize(18, 10);
    sprite.body.setOffset(23, 50);
}
```

## Collision Box Dimensions

### Player
| Sprite Type | Size | Width | Height | X Offset | Y Offset |
|------------|------|-------|--------|----------|----------|
| Legacy (64x64) | Small | 15 | 10 | 25 | 50 |
| Atlas (80x80) | Small | 18 | 10 | 31 | 66 |

### NPCs
| Sprite Type | Size | Width | Height | X Offset | Y Offset |
|------------|------|-------|--------|----------|----------|
| Legacy (64x64) | Standard | 18 | 10 | 23 | 50 |
| Atlas (80x80) | Standard | 20 | 10 | 30 | 66 |

## Visual Representation

### 64x64 Legacy Sprite
```
┌──────────────────┐  ← Top (0)
│                  │
│                  │
│     SPRITE       │
│                  │
│        ▲         │
│       [●]        │  ← Collision box (50px from top)
└──────[█]─────────┘  ← Bottom (64)
       ^^^ 15px wide, 10px high
```

### 80x80 Atlas Sprite
```
┌────────────────────┐  ← Top (0)
│                    │
│                    │
│      SPRITE        │
│                    │
│                    │
│         ▲          │
│        [●]         │  ← Collision box (66px from top)
└────────[█]─────────┘  ← Bottom (80)
        ^^^ 18px wide, 10px high
```

## Testing

Verified with both sprite types:
- ✅ Player collision at correct height
- ✅ NPC collision at correct height
- ✅ Proper depth sorting (no floating)
- ✅ Collision with walls works correctly
- ✅ Character-to-character collision accurate
- ✅ Backward compatibility with legacy sprites

## Implementation Notes

### Automatic Detection
The system automatically detects sprite type:
```javascript
const isAtlas = scene.cache.json.exists(spriteSheet);
```

- **Atlas sprites**: Have a corresponding JSON file in cache
- **Legacy sprites**: Do not have JSON in cache

### Console Logging
Debug messages indicate which collision box is used:
```
🎮 Player using atlas sprite (80x80) with adjusted collision box
🎮 Player using legacy sprite (64x64) with standard collision box
```

## Backward Compatibility

✅ **Legacy sprites continue to work** with original collision boxes  
✅ **No changes needed to existing scenarios** using legacy sprites  
✅ **Automatic detection** ensures correct boxes are applied  

## Related Fixes

This fix was part of the larger sprite system update that also included:
- 8-directional animation support
- Breathing idle animations
- Atlas-based animation loading
- NPC animation frame fix

## Known Issues

None currently identified.

## Future Improvements

- [ ] Make collision box dimensions configurable per character
- [ ] Add visual debug mode to show collision boxes
- [ ] Support for different collision box shapes (circle, polygon)
- [ ] Character-specific collision box sizes (tall/short characters)
