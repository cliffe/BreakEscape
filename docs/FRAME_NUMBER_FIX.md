# Frame Number Fix - Atlas vs Legacy Sprites

## Problem

Error when creating NPCs with atlas sprites:
```
Texture "male_spy" has no frame "20"
```

## Root Cause

The NPC sprite creation was using a hardcoded frame number (20) which works for legacy 64x64 sprites but doesn't exist in atlas sprites.

### Legacy Sprites (64x64)
- Use **numbered frames**: 0, 1, 2, 3, ..., 20, 21, etc.
- Frame 20 is the idle down-right frame
- Frames are generated from a regular grid layout

### Atlas Sprites (80x80)
- Use **named frames**: `"breathing-idle_south_frame_000"`, `"walk_east_frame_001"`, etc.
- Frame numbers don't exist - only frame names
- Frames are defined in the JSON atlas

## Solution

Detect sprite type and use appropriate initial frame:

### Implementation

```javascript
// Check if this is an atlas sprite
const isAtlas = scene.cache.json.exists(spriteSheet);

// Determine initial frame
let initialFrame;
if (isAtlas) {
    // Atlas sprite - use first frame from breathing-idle_south animation
    const atlasData = scene.cache.json.get(spriteSheet);
    if (atlasData?.animations?.['breathing-idle_south']) {
        initialFrame = atlasData.animations['breathing-idle_south'][0];
    } else {
        // Fallback to first frame in atlas
        initialFrame = 0;
    }
} else {
    // Legacy sprite - use configured frame or default to 20
    initialFrame = config.idleFrame || 20;
}

// Create sprite with correct frame
const sprite = scene.add.sprite(worldPos.x, worldPos.y, spriteSheet, initialFrame);
```

## Frame Selection Logic

### For Atlas Sprites
1. **First choice**: First frame of `breathing-idle_south` animation (facing down)
   - Example: `"breathing-idle_south_frame_000"`
   - This ensures the character starts in a natural idle pose facing downward
   
2. **Fallback**: Frame 0 (first frame in the atlas)
   - Used if breathing-idle animation doesn't exist

### For Legacy Sprites
1. **First choice**: `config.idleFrame` (if specified in scenario)
2. **Fallback**: Frame 20 (down-right idle frame)

## Why Frame 20 for Legacy?

Legacy sprites use this frame layout:
```
Row 0 (frames 0-4):   Right walk
Row 1 (frames 5-9):   Down walk
Row 2 (frames 10-14): Up walk
Row 3 (frames 15-19): Up-right walk
Row 4 (frames 20-24): Down-right walk  ← Frame 20 is first frame of this row
```

Frame 20 is the idle down-right pose, which is a good default starting position.

## Why breathing-idle_south for Atlas?

Atlas sprites have structured animation names:
```
breathing-idle_south  → Idle breathing facing down
breathing-idle_east   → Idle breathing facing right
walk_north           → Walking upward
```

`breathing-idle_south` (down) is the most natural default direction for a character to face when first appearing.

## Files Modified

**File**: `public/break_escape/js/systems/npc-sprites.js`  
**Function**: `createNPCSprite()`  
**Lines**: 25-60

## Testing

Verified with:
- ✅ Atlas sprites (female_hacker_hood, male_spy, etc.) - No frame errors
- ✅ Legacy sprites (hacker, hacker-red) - Still works as before
- ✅ NPCs spawn with correct initial pose
- ✅ Animations play correctly after spawn
- ✅ Console logging shows correct frame selection

## Console Output

```
🎭 NPC briefing_cutscene created with atlas sprite (male_spy), initial frame: breathing-idle_south_frame_000
🎭 NPC sarah_martinez created with atlas sprite (female_office_worker), initial frame: breathing-idle_south_frame_000
🎭 NPC old_npc created with legacy sprite (hacker), initial frame: 20
```

## Error Prevention

### Before Fix
```javascript
const idleFrame = config.idleFrame || 20;  // ❌ Always uses number
const sprite = scene.add.sprite(x, y, spriteSheet, idleFrame);
// ERROR: Texture "male_spy" has no frame "20"
```

### After Fix
```javascript
const isAtlas = scene.cache.json.exists(spriteSheet);
let initialFrame;
if (isAtlas) {
    // Use named frame from atlas
    initialFrame = atlasData.animations['breathing-idle_south'][0];
} else {
    // Use numbered frame
    initialFrame = config.idleFrame || 20;
}
const sprite = scene.add.sprite(x, y, spriteSheet, initialFrame);
// ✅ Works for both atlas and legacy sprites
```

## Related Issues

This is part of a series of fixes for atlas sprite support:
1. ✅ 8-directional animation support
2. ✅ Collision box adjustment for 80x80 sprites
3. ✅ NPC animation stuck on single frame
4. ✅ Initial frame selection (this fix)

## Future Improvements

- [ ] Allow specifying initial direction in scenario config
- [ ] Support custom initial frames per NPC
- [ ] Add visual indicator of sprite type in debug mode
- [ ] Validate frame exists before creating sprite

## Backward Compatibility

✅ **Fully backward compatible**
- Legacy sprites continue to use frame 20 (or configured frame)
- Atlas sprites use appropriate named frames
- No changes needed to existing scenarios
- Automatic detection ensures correct behavior

## Performance

- **No performance impact**: Frame selection happens once at sprite creation
- **Minimal overhead**: Single JSON cache check to determine sprite type
- **Efficient**: Uses first frame from animation data without searching
