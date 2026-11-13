# 8-Directional Animation Fix

## Problem

NPCs and player were only using 2 directions (left/right) instead of all 8 directions when using the new PixelLab atlas sprites.

## Root Cause

The animation system was designed for legacy 64x64 sprites which only had 5 native directions (right, down, up, down-right, up-right). Left-facing directions were created by horizontally flipping the right-facing animations.

The new 80x80 PixelLab atlas sprites have all 8 native directions, but the code was still doing the left→right mapping and flipping, which prevented the native left-facing animations from being used.

## Solution

Updated both NPC and player animation systems to:

1. Detect whether a sprite is atlas-based (has native left animations)
2. Use native directions for atlas sprites
3. Fall back to flip-based behavior for legacy sprites

## Changes Made

### 1. NPC System (`js/systems/npc-behavior.js`)

**Updated `playAnimation()` method:**

```javascript
// Before: Always mapped left→right with flipX
if (direction.includes('left')) {
    animDirection = direction.replace('left', 'right');
    flipX = true;
}

// After: Check if native left animations exist
const directAnimKey = `npc-${this.npcId}-${state}-${direction}`;
const hasNativeLeftAnimations = this.scene?.anims?.exists(directAnimKey);

if (!hasNativeLeftAnimations && direction.includes('left')) {
    animDirection = direction.replace('left', 'right');
    flipX = true;
}
```

### 2. Player System (`js/core/player.js`)

**A. Updated `createPlayerAnimations()`:**

- Added detection for atlas vs legacy sprites
- Created `createAtlasPlayerAnimations()` for atlas sprites
- Created `createLegacyPlayerAnimations()` for legacy sprites
- Atlas animations are read from JSON metadata
- Legacy animations use hardcoded frame numbers

**B. Updated `getAnimationKey()`:**

```javascript
// Before: Always mapped left→right
switch(direction) {
    case 'left': return 'right';
    case 'down-left': return 'down-right';
    case 'up-left': return 'up-right';
}

// After: Check if native left exists
const hasNativeLeft = gameRef.anims.exists(`idle-left`);
if (hasNativeLeft) {
    return direction; // Use native direction
}
```

**C. Updated movement functions:**

- `updatePlayerKeyboardMovement()` - Added atlas detection, conditional flipping
- `updatePlayerMouseMovement()` - Added atlas detection, conditional flipping
- Both now check for native left animations before applying flipX

**D. Updated sprite creation:**

```javascript
// Before: Hardcoded 'hacker' sprite
player = gameInstance.add.sprite(x, y, 'hacker', 20);

// After: Use sprite from scenario config
const playerSprite = window.scenarioConfig?.player?.spriteSheet || 'hacker';
player = gameInstance.add.sprite(x, y, playerSprite, initialFrame);
```

## Animation Key Format

### Atlas Sprites (8 Native Directions)

- **Player**: `walk-left`, `walk-right`, `walk-up-left`, `idle-down-right`, etc.
- **NPCs**: `npc-{id}-walk-left`, `npc-{id}-idle-up-left`, etc.
- **No flipping** - uses native animations

### Legacy Sprites (5 Native Directions + Flipping)

- **Player**: `walk-right` (flipped for left), `walk-up-right` (flipped for up-left)
- **NPCs**: `npc-{id}-walk-right` (flipped for left)
- **Flipping applied** - uses setFlipX(true) for left directions

## Direction Mapping

Atlas directions → Game directions:

| Atlas Direction | Game Direction |
| --------------- | -------------- |
| east            | right          |
| west            | left           |
| north           | up             |
| south           | down           |
| north-east      | up-right       |
| north-west      | up-left        |
| south-east      | down-right     |
| south-west      | down-left      |

## Testing

Tested with:

- ✅ NPCs using atlas sprites (female_office_worker, male_spy, etc.)
- ✅ Player using atlas sprite (female_hacker_hood)
- ✅ Legacy NPCs still working (hacker, hacker-red)
- ✅ 8-directional movement for atlas sprites
- ✅ Proper facing when idle
- ✅ Correct animations during patrol
- ✅ Smooth animation transitions

## Backward Compatibility

The system remains fully backward compatible:

- Legacy sprites continue to use the flip-based system
- Detection is automatic based on animation existence
- No changes required to existing scenarios using legacy sprites
- Both systems can coexist in the same game

## Performance

No performance impact:

- Animation existence check is cached by Phaser
- Single extra check per animation play (negligible)
- Atlas sprites actually perform better (fewer texture swaps)

## Known Issues

None currently identified.

## Future Improvements

- [ ] Cache the atlas detection result per NPC/player to avoid repeated checks
- [ ] Add visual debug mode to show which direction NPC is facing
- [ ] Consider refactoring to a unified animation manager for player and NPCs
