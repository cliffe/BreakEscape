# Player Sprite Configuration Fix

## Problem

The player sprite was not loading from the scenario configuration and was always defaulting to 'hacker', even when a different sprite was configured in `scenario.json.erb`.

## Root Cause

The code was looking for `window.scenarioConfig` but the actual global variable is `window.gameScenario`.

### Wrong Variable Name

**Code was checking:**
```javascript
const playerSprite = window.scenarioConfig?.player?.spriteSheet || 'hacker';
//                          ^^^^^^^^^^^^^ WRONG
```

**Should be:**
```javascript
const playerSprite = window.gameScenario?.player?.spriteSheet || 'hacker';
//                          ^^^^^^^^^^^^ CORRECT
```

## Where gameScenario is Set

In `game.js` create function:
```javascript
if (!window.gameScenario) {
    window.gameScenario = this.cache.json.get('gameScenarioJSON');
}
```

The scenario is loaded from the JSON file and stored in `window.gameScenario`, not `window.scenarioConfig`.

## Files Fixed

### 1. Player System (`js/core/player.js`)

Fixed 3 locations:

**A. Player Creation:**
```javascript
// Before
const playerSprite = window.scenarioConfig?.player?.spriteSheet || 'hacker';

// After
const playerSprite = window.gameScenario?.player?.spriteSheet || 'hacker';
console.log(`🎮 Loading player sprite: ${playerSprite} (from ${window.gameScenario?.player ? 'scenario' : 'default'})`);
```

**B. Animation Creation:**
```javascript
// Before
const playerSprite = window.scenarioConfig?.player?.spriteSheet || 'hacker';

// After
const playerSprite = window.gameScenario?.player?.spriteSheet || 'hacker';
```

**C. Frame Rate Config:**
```javascript
// Before
const playerConfig = window.scenarioConfig?.player?.spriteConfig || {};

// After
const playerConfig = window.gameScenario?.player?.spriteConfig || {};
```

### 2. Game System (`js/core/game.js`)

**Character Registry Registration:**
```javascript
// Before
const playerData = {
    id: 'player',
    displayName: window.gameState?.playerName || 'Agent 0x00',
    spriteSheet: 'hacker',  // ← HARDCODED
    spriteTalk: 'assets/characters/hacker-talk.png',  // ← HARDCODED
    metadata: {}
};

// After
const playerData = {
    id: 'player',
    displayName: window.gameState?.playerName || window.gameScenario?.player?.displayName || 'Agent 0x00',
    spriteSheet: window.gameScenario?.player?.spriteSheet || 'hacker',
    spriteTalk: window.gameScenario?.player?.spriteTalk || 'assets/characters/hacker-talk.png',
    metadata: {}
};
```

## Impact

### Before Fix
- ❌ Player always used 'hacker' sprite (64x64 legacy)
- ❌ Scenario configuration ignored
- ❌ Could not use new atlas sprites for player
- ❌ spriteTalk always defaulted to hacker-talk.png
- ❌ displayName always defaulted to 'Agent 0x00'

### After Fix
- ✅ Player uses configured sprite from scenario
- ✅ Can use atlas sprites (80x80 with 8 directions)
- ✅ spriteTalk loaded from scenario
- ✅ displayName loaded from scenario
- ✅ Frame rates configured per scenario
- ✅ Falls back to 'hacker' if not configured

## Scenario Configuration

Now this works correctly:

```json
{
  "player": {
    "id": "player",
    "displayName": "Agent 0x00",
    "spriteSheet": "female_hacker_hood",
    "spriteTalk": "assets/characters/hacker-talk.png",
    "spriteConfig": {
      "idleFrameRate": 6,
      "walkFrameRate": 10
    }
  }
}
```

## Console Logging

Added debug logging to verify correct loading:

```
🎮 Loading player sprite: female_hacker_hood (from scenario)
🔍 Player sprite female_hacker_hood: 256 frames, first: "breathing-idle_east_frame_000", isAtlas: true
🎮 Player using atlas sprite: female_hacker_hood
```

If scenario not loaded:
```
🎮 Loading player sprite: hacker (from default)
```

## Testing

Tested with:
- ✅ Player configured as `female_hacker_hood` - Loads correctly
- ✅ Player configured as `male_hacker` - Loads correctly
- ✅ No player config - Falls back to 'hacker'
- ✅ spriteTalk from scenario - Used in chat portraits
- ✅ displayName from scenario - Used in UI

## Global Variables Reference

For future reference, the correct global variables are:

| Variable | Purpose | Set In | Type |
|----------|---------|--------|------|
| `window.gameScenario` | Full scenario data | game.js create() | Object |
| `window.gameState` | Current game state | state-sync.js | Object |
| `window.player` | Player sprite | player.js | Phaser.Sprite |
| `window.characterRegistry` | Character data | character-registry.js | Object |

**NOT** `window.scenarioConfig` (doesn't exist)

## Related Fixes

This was one of several configuration issues:
1. ✅ scenarioConfig → gameScenario (variable name)
2. ✅ Hardcoded sprite → configured sprite
3. ✅ Hardcoded spriteTalk → configured spriteTalk
4. ✅ Hardcoded displayName → configured displayName

## Prevention

To avoid this in the future:
- [ ] Use consistent naming conventions
- [ ] Document global variables
- [ ] Add type checking/validation for scenario structure
- [ ] Consider using a centralized config accessor

## Commit Message

```
Fix player sprite not loading from scenario config

Player was always using 'hacker' sprite because code was looking
for window.scenarioConfig instead of window.gameScenario.

Fixed references in:
- player.js: createPlayer(), createPlayerAnimations(), createAtlasPlayerAnimations()
- game.js: Character registry registration

Now properly loads:
- spriteSheet from scenario.player.spriteSheet
- spriteTalk from scenario.player.spriteTalk
- displayName from scenario.player.displayName
- spriteConfig (frame rates) from scenario.player.spriteConfig

Falls back to 'hacker' if not configured.
```
