# Sound System Quick Reference

## Quick Start

### In Code - Play a Sound
```javascript
// Access globally available sound manager
window.soundManager.play('ui_click_1');
window.soundManager.playUIClick();         // Random click
window.soundManager.playUINotification();  // Random notification
```

### Using UI Helpers
```javascript
import { playUISound } from '../systems/ui-sounds.js';

playUISound('click');         // Random UI click
playUISound('notification');  // Random notification
playUISound('item');          // Random item sound
playUISound('lock');          // Random lock sound
playUISound('confirm');       // Confirmation sound
playUISound('reject');        // Error/rejection sound
```

### Attach Sounds to DOM
```javascript
import { attachUISound } from '../systems/ui-sounds.js';

const button = document.getElementById('my-button');
attachUISound(button, 'click');
```

## Common Tasks

### Play Sound When Item Collected
```javascript
import { playUISound } from '../systems/ui-sounds.js';

// Already integrated in interactions.js:
playUISound('item');
```

### Play Sound On Lock Attempt
```javascript
// Already integrated in unlock-system.js:
playUISound('lock');
```

### Play Sound On UI Panel Open
```javascript
// Already integrated in panels.js:
playUISound('notification');
```

### Control Volume
```javascript
// Master volume (0-1)
window.soundManager.setMasterVolume(0.7);

// Category volume
window.soundManager.setCategoryVolume('ui', 0.8);
window.soundManager.setCategoryVolume('effects', 0.9);
```

### Toggle Sound On/Off
```javascript
window.soundManager.toggle();        // Toggle on/off
window.soundManager.setEnabled(false); // Disable
window.soundManager.setEnabled(true);  // Enable
```

## Sound Categories

- **ui** - Button clicks, UI interactions
- **interactions** - Item pickups, lock attempts
- **notifications** - Alerts, notifications
- **effects** - Game-specific effects
- **music** - Background music (reserved)

## All Available Sounds

| Category | Sound Name | Count |
|----------|-----------|--------|
| Lockpicking | lockpick_binding, lockpick_click, lockpick_overtension, lockpick_reset, lockpick_set, lockpick_success, lockpick_tension, lockpick_wrong | 8 |
| Door | door_knock | 1 |
| Item Interact | item_interact_1, item_interact_2, item_interact_3 | 3 |
| Lock Interact | lock_interact_1-4, lock_and_load | 5 |
| UI Clicks | ui_click_1-4, ui_click_6 | 5 |
| UI Alerts | ui_alert_1, ui_alert_2 | 2 |
| UI Confirm | ui_confirm | 1 |
| UI Notifications | ui_notification_1-6 | 6 |
| UI Reject | ui_reject | 1 |
| Game Sounds | chair_roll, message_received | 2 |
| **Total** | | **34** |

## Integration Checklist

- ✅ Sound manager created and initialized
- ✅ All GASP sounds loaded
- ✅ Lockpicking sounds already integrated
- ✅ Item collection sounds integrated
- ✅ Lock attempt sounds integrated
- ✅ UI panel sounds integrated
- ✅ Documentation complete

## Files Modified/Created

1. **Created**: `js/systems/sound-manager.js` - Core sound system
2. **Created**: `js/systems/ui-sounds.js` - UI sound helpers
3. **Created**: `docs/SOUND_SYSTEM.md` - Full documentation
4. **Modified**: `js/core/game.js` - Load and initialize sounds
5. **Modified**: `js/systems/interactions.js` - Play sounds on interactions
6. **Modified**: `js/systems/unlock-system.js` - Play sounds on lock attempts
7. **Modified**: `js/ui/panels.js` - Play sounds on panel operations
