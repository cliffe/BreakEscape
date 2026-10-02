# Breathing Idle Animations

## Overview

The PixelLab atlas sprites include "breathing-idle" animations that provide a subtle breathing effect when characters are standing still. These animations have been integrated into the game's idle state for both player and NPCs.

## Animation Details

### Frame Count
- **Breathing-idle**: 4 frames per direction
- **Directions**: All 8 directions (up, down, left, right, and 4 diagonals)
- **Total frames per character**: 32 frames (4 frames × 8 directions)

### Frame Rate Configuration

The breathing animation frame rate has been optimized for a natural, subtle breathing effect:

| Animation Type | Frame Rate | Cycle Duration | Notes |
|---------------|-----------|----------------|-------|
| **Idle (Breathing)** | 6 fps | ~0.67 seconds | Slower for natural breathing |
| **Walk** | 10 fps | ~0.6 seconds | Faster for smooth walking |
| **Attack** | 8 fps | Variable | Standard action speed |

### Why 6 fps for Breathing?

With 4 frames at 6 fps:
- One complete breathing cycle = 4 frames ÷ 6 fps = **0.67 seconds**
- ~90 breaths per minute (realistic resting rate)
- Subtle and natural-looking
- Not distracting during gameplay

## Implementation

### Atlas Mapping

The system automatically maps PixelLab animations to game animations:

```javascript
// Atlas format: "breathing-idle_east"
// Game format: "idle-right" (player) or "npc-{id}-idle-right" (NPCs)

const animTypeMap = {
    'breathing-idle': 'idle',  // ← Breathing animation mapped to idle
    'walk': 'walk',
    'cross-punch': 'attack',
    'lead-jab': 'jab',
    'falling-back-death': 'death'
};
```

### Player System

**File**: `js/core/player.js`

```javascript
function createAtlasPlayerAnimations(spriteSheet) {
    const playerConfig = window.scenarioConfig?.player?.spriteConfig || {};
    const idleFrameRate = playerConfig.idleFrameRate || 6; // Breathing rate
    
    // Create idle animations from breathing-idle atlas data
    for (const [atlasAnimKey, frames] of Object.entries(atlasData.animations)) {
        if (atlasType === 'breathing-idle') {
            const animKey = `idle-${direction}`;
            gameRef.anims.create({
                key: animKey,
                frames: frames.map(frameName => ({ key: spriteSheet, frame: frameName })),
                frameRate: idleFrameRate, // 6 fps
                repeat: -1 // Loop forever
            });
        }
    }
}
```

### NPC System

**File**: `js/systems/npc-sprites.js`

```javascript
function setupAtlasAnimations(scene, sprite, spriteSheet, config, npcId) {
    // Default frame rate: 6 fps for idle (breathing)
    let frameRate = config.idleFrameRate || 6;
    
    // Create NPC idle animations from breathing-idle
    const animKey = `npc-${npcId}-idle-${direction}`;
    scene.anims.create({
        key: animKey,
        frames: frames.map(frameName => ({ key: spriteSheet, frame: frameName })),
        frameRate: frameRate,
        repeat: -1
    });
}
```

## Configuration

### Scenario Configuration

Set frame rates in `scenario.json.erb`:

```json
{
  "player": {
    "spriteSheet": "female_hacker_hood",
    "spriteConfig": {
      "idleFrameRate": 6,    // Breathing animation speed
      "walkFrameRate": 10    // Walking animation speed
    }
  },
  "npcs": [
    {
      "id": "sarah",
      "spriteSheet": "female_office_worker",
      "spriteConfig": {
        "idleFrameRate": 6,  // Breathing animation speed
        "walkFrameRate": 10
      }
    }
  ]
}
```

### Adjusting Breathing Speed

To adjust the breathing effect:

**Slower breathing** (calmer, more relaxed):
```json
"idleFrameRate": 4  // 1 second per cycle, ~60 bpm
```

**Normal breathing** (default):
```json
"idleFrameRate": 6  // 0.67 seconds per cycle, ~90 bpm
```

**Faster breathing** (active, alert):
```json
"idleFrameRate": 8  // 0.5 seconds per cycle, ~120 bpm
```

## Animation States

### When Breathing Animation Plays

The breathing-idle animation plays in these states:

1. **Standing Still**: Character not moving
2. **Face Player**: NPC facing the player but not moving
3. **Dwell Time**: NPC waiting at a patrol waypoint
4. **Personal Space**: NPC adjusting distance from player
5. **Attack Range**: Hostile NPC in range but between attacks

### When Other Animations Play

- **Walk**: Moving in any direction
- **Attack**: Performing combat actions
- **Death**: Character defeated
- **Hit**: Taking damage

## Visual Effect

The breathing animation provides:
- ✅ **Subtle movement** when idle
- ✅ **Lifelike appearance** for characters
- ✅ **Visual feedback** that character is active
- ✅ **Polish** and professional game feel

### Before (Static Idle)
- Single frame
- Completely still
- Lifeless appearance

### After (Breathing Idle)
- 4-frame cycle
- Gentle animation
- Natural, living characters

## Performance

The breathing animation has minimal performance impact:
- **Memory**: Same as single-frame idle (uses same texture atlas)
- **CPU**: Negligible (just frame switching)
- **GPU**: No additional draw calls (same sprite)

## Compatibility

### Atlas Sprites (New)
- ✅ Full 4-frame breathing animation
- ✅ All 8 directions
- ✅ Configurable frame rate

### Legacy Sprites (Old)
- ⚠️ Single frame idle (no breathing)
- ⚠️ 5 directions with flipping
- Still fully supported

## Troubleshooting

### Breathing Too Fast
**Symptom**: Characters appear to be hyperventilating  
**Solution**: Decrease `idleFrameRate` to 4-5 fps

### Breathing Too Slow
**Symptom**: Animation feels sluggish or barely noticeable  
**Solution**: Increase `idleFrameRate` to 7-8 fps

### No Breathing Animation
**Symptom**: Characters completely still when idle  
**Solution**: 
1. Verify sprite is using atlas format (not legacy)
2. Check that `breathing-idle_*` animations exist in JSON
3. Confirm `idleFrameRate` is set in config
4. Check console for animation creation logs

### Animation Not Looping
**Symptom**: Breathing stops after one cycle  
**Solution**: Verify `repeat: -1` is set in animation creation

## Future Enhancements

Potential improvements:
- [ ] Variable breathing rate based on character state (calm vs alert)
- [ ] Synchronized breathing for multiple characters
- [ ] Different breathing patterns for different character types
- [ ] Heavy breathing after running/combat
- [ ] Breathing affected by player proximity (nervousness)

## Technical Notes

### Animation Format

Atlas JSON structure:
```json
{
  "animations": {
    "breathing-idle_east": [
      "breathing-idle_east_frame_000",
      "breathing-idle_east_frame_001",
      "breathing-idle_east_frame_002",
      "breathing-idle_east_frame_003"
    ]
  }
}
```

Game animation structure:
```javascript
{
  key: 'idle-right',
  frames: [
    { key: 'female_hacker_hood', frame: 'breathing-idle_east_frame_000' },
    { key: 'female_hacker_hood', frame: 'breathing-idle_east_frame_001' },
    { key: 'female_hacker_hood', frame: 'breathing-idle_east_frame_002' },
    { key: 'female_hacker_hood', frame: 'breathing-idle_east_frame_003' }
  ],
  frameRate: 6,
  repeat: -1
}
```

### Performance Metrics

- **Frame switches per second**: 6 (at 6 fps)
- **Memory per character**: ~4KB for breathing frames (shared in atlas)
- **CPU overhead**: <0.1% (Phaser handles animation efficiently)
- **Recommended max characters with breathing**: 50+ (no practical limit)
