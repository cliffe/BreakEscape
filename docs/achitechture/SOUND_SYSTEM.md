# Break Escape Sound System Documentation

## Overview
The Break Escape sound system is a centralized Phaser-based audio management system that handles all game sound effects, including UI interactions, item collection, lock interactions, and mini-game specific sounds.

## Architecture

### Core Components

#### 1. **SoundManager** (`js/systems/sound-manager.js`)
The central sound management class that:
- Loads all audio assets during preload phase
- Creates and manages Phaser sound objects
- Provides convenient playback methods
- Manages volume levels and categories
- Supports sound toggling and master volume control

#### 2. **UI Sounds Helper** (`js/systems/ui-sounds.js`)
Utility module that:
- Provides DOM element sound attachment helpers
- Plays category-specific sounds (clicks, notifications, etc.)
- Bridges DOM events with sound playback
- Offers specialized functions for game-specific sounds

#### 3. **Game Integration** (`js/core/game.js`)
Integration points:
- Preload sounds during `preload()` function
- Initialize sound manager in `create()` function
- Expose sound manager globally as `window.soundManager`

## Available Sounds

### Sound Assets (36 total)

#### Lockpicking Mini-Game (8 sounds)
- `lockpick_binding` - Binding pin feedback
- `lockpick_click` - Pin click during picking
- `lockpick_overtension` - Overtension/overpicking failure
- `lockpick_reset` - Lock reset
- `lockpick_set` - Pin set successfully
- `lockpick_success` - Lock successfully picked
- `lockpick_tension` - Tension wrench feedback
- `lockpick_wrong` - Wrong lock manipulated

#### GASP Door Sounds (1 sound)
- `door_knock` - Door knock/activation sound

#### GASP Item Interactions (3 sounds)
- `item_interact_1` - Item pickup sound variant 1
- `item_interact_2` - Item pickup sound variant 2
- `item_interact_3` - Item pickup sound variant 3

#### GASP Lock Interactions (5 sounds)
- `lock_interact_1` - Lock attempt sound variant 1
- `lock_interact_2` - Lock attempt sound variant 2
- `lock_interact_3` - Lock attempt sound variant 3
- `lock_interact_4` - Lock attempt sound variant 4
- `lock_and_load` - Lock loading/preparation sound

#### GASP UI Clicks (5 sounds)
- `ui_click_1` - Button click variant 1
- `ui_click_2` - Button click variant 2
- `ui_click_3` - Button click variant 3
- `ui_click_4` - Button click variant 4
- `ui_click_6` - Button click variant 6

#### GASP UI Alerts (2 sounds)
- `ui_alert_1` - Alert sound variant 1
- `ui_alert_2` - Alert sound variant 2

#### GASP UI Confirmation (1 sound)
- `ui_confirm` - Successful action confirmation

#### GASP UI Notifications (6 sounds)
- `ui_notification_1` through `ui_notification_6` - Various notification sounds

#### GASP UI Reject (1 sound)
- `ui_reject` - Error/rejection sound

#### Game-Specific Sounds (2 sounds)
- `chair_roll` - Chair spinning/rolling sound
- `message_received` - Incoming message notification

## Usage

### Basic Usage in Code

#### Playing a Sound
```javascript
// Access the sound manager
const soundManager = window.soundManager;

// Play a specific sound
soundManager.play('ui_click_1');

// Play with options
soundManager.play('ui_click_1', { volume: 0.8, delay: 100 });

// Play random variant
soundManager.playUIClick();  // Plays random click sound
soundManager.playUINotification();  // Plays random notification
soundManager.playItemInteract();  // Plays random item sound
soundManager.playLockInteract();  // Plays random lock sound
```

#### Volume Control
```javascript
// Set master volume (0-1)
soundManager.setMasterVolume(0.7);

// Set category volume
soundManager.setCategoryVolume('ui', 0.8);
soundManager.setCategoryVolume('effects', 0.9);

// Available categories: ui, interactions, notifications, effects, music
```

#### Sound State
```javascript
// Toggle sound on/off
soundManager.toggle();

// Explicitly set enabled/disabled
soundManager.setEnabled(false);
soundManager.setEnabled(true);

// Check if sounds are enabled
if (soundManager.isEnabled()) {
    // Play sound
}

// Stop all sounds
soundManager.stopAll();
```

### Using UI Sound Helpers

#### Attaching Sounds to DOM Elements
```javascript
import { attachUISound, playUISound } from '../systems/ui-sounds.js';

// Attach sound to a single element
const button = document.getElementById('my-button');
attachUISound(button, 'click');  // Plays random click on click

// Attach sounds to all elements with a class
attachUISoundsToClass('inventory-button', 'click');

// Specialized attachment functions
attachConfirmSound(button);    // Attach confirmation sound
attachRejectSound(button);     // Attach error sound
attachItemSound(button);       // Attach item interaction sound
attachLockSound(button);       // Attach lock interaction sound
attachNotificationSound(button); // Attach notification sound
```

#### Playing Sounds Programmatically
```javascript
import { playUISound, playGameSound } from '../systems/ui-sounds.js';

// Play categorized sounds
playUISound('click');           // Play random UI click
playUISound('notification');    // Play random notification
playUISound('item');            // Play random item interaction
playUISound('lock');            // Play random lock interaction
playUISound('confirm');         // Play confirmation
playUISound('alert');           // Play alert
playUISound('reject');          // Play rejection/error

// Play specific game sounds
playGameSound('door_knock');
playGameSound('chair_roll');
playGameSound('message_received');

// Direct convenience functions
import { 
    playDoorKnock, 
    playChairRoll, 
    playMessageReceived 
} from '../systems/ui-sounds.js';

playDoorKnock();
playChairRoll();
playMessageReceived();
```

## Volume Categories

The system supports 5 volume categories with independent controls:

- **ui** (0.7 default): UI clicks, button sounds
- **interactions** (0.8 default): Item interactions, lock interactions, door knocks
- **notifications** (0.6 default): Alert sounds, rejection sounds, notifications
- **effects** (0.85 default): Game-specific effects like chair rolling, lockpicking
- **music** (0.5 default): Background music (reserved for future use)

### Setting Category Volumes
```javascript
soundManager.setCategoryVolume('ui', 0.7);
soundManager.setCategoryVolume('interactions', 0.8);
soundManager.setCategoryVolume('notifications', 0.6);
soundManager.setCategoryVolume('effects', 0.85);
```

## Integration Points

### Automatic Integration
The following systems automatically include sound effects:

1. **Item Collection** (`js/systems/interactions.js`)
   - Plays item interaction sound when collecting items
   - File path: Item pickup → `playUISound('item')`

2. **Lock Interactions** (`js/systems/unlock-system.js`)
   - Plays lock interaction sound when attempting unlock
   - File path: Lock attempt → `playUISound('lock')`

3. **UI Panels** (`js/ui/panels.js`)
   - Plays notification sound when showing panels
   - File path: Panel toggle/show → `playUISound('notification')`

4. **Lockpicking Mini-Game** (`js/minigames/lockpicking/lockpicking-game-phaser.js`)
   - Uses dedicated lockpick sounds for each interaction
   - Plays sounds during pin manipulation, tension application, etc.

### Adding Sounds to New Features

#### For Button Clicks
```javascript
import { attachUISound } from '../systems/ui-sounds.js';

const myButton = document.getElementById('my-button');
attachUISound(myButton, 'click');
```

#### For Game Events
```javascript
import { playUISound } from '../systems/ui-sounds.js';

// In your event handler
playUISound('notification');  // or 'click', 'confirm', 'reject', etc.
```

#### For Mini-Games
```javascript
// In your mini-game scene
preload() {
    // Sounds are already loaded globally
}

create() {
    // Access sounds via window.soundManager
    window.soundManager.play('ui_click_1');
}
```

## Configuration

### Default Volume Levels
Edit these in `SoundManager` constructor in `js/systems/sound-manager.js`:
```javascript
this.volumeSettings = {
    ui: 0.7,
    interactions: 0.8,
    notifications: 0.6,
    effects: 0.85,
    music: 0.5
};
```

### Adding New Sounds

1. Place MP3 file in `assets/sounds/`
2. Add load call in `SoundManager.preloadSounds()`:
   ```javascript
   this.scene.load.audio('my_sound', 'assets/sounds/my_sound.mp3');
   ```
3. Add to sound names array in `initializeSounds()`:
   ```javascript
   const soundNames = [
       // ... existing sounds
       'my_sound'
   ];
   ```
4. Determine volume category in `getVolumeForSound()`:
   ```javascript
   if (soundName.includes('my_sound')) category = 'effects';
   ```

## Best Practices

### Performance
- Sounds are cached after initial load
- Random variants prevent sound repetition fatigue
- Volume categories allow balanced audio mixing
- Master volume can disable all sounds efficiently

### User Experience
- Sounds give immediate feedback to user actions
- Different sound types (click, notification, etc.) indicate different action types
- Random variants add perceived variety and polish
- Category-based volume control lets players customize audio mix

### Implementation
- Always check `window.soundManager` exists before playing sounds
- Use category-specific helpers (`playUISound()`, `playGameSound()`) for consistency
- Attach DOM sounds in initialization phase, not every event handler
- Use random sound functions (`playUIClick()`) instead of single sounds

## Troubleshooting

### Sounds Not Playing
1. Check if sound manager is initialized: `console.log(window.soundManager)`
2. Check browser console for errors
3. Verify sound files exist in `assets/sounds/`
4. Check if sounds are enabled: `window.soundManager.isEnabled()`
5. Verify volume isn't muted: `window.soundManager.masterVolume > 0`

### Sounds Too Loud/Quiet
1. Check master volume: `window.soundManager.masterVolume`
2. Check category volume: `window.soundManager.volumeSettings['category_name']`
3. Adjust with: `soundManager.setMasterVolume(0.7)` or `soundManager.setCategoryVolume('ui', 0.8)`

### Performance Issues
- Limit simultaneous sounds
- Use sound pooling (already implemented in Phaser)
- Reduce category volumes if CPU usage is high

## Future Enhancements

Potential improvements for the sound system:
1. Background music support with fade in/out
2. 3D positional audio for in-game sound effects
3. Sound preferences UI panel
4. Audio profile saves (for accessibility)
5. NPC voice lines integration
6. Ambient sound support
7. Sound effect composition for mini-games
