# Sound System Architecture Diagram

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     BREAK ESCAPE GAME                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Phaser Game Instance (game.js)             │   │
│  │  - Manages scenes, physics, rendering                 │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          SoundManager (sound-manager.js)             │   │
│  │                                                       │   │
│  │  Preload Phase:                                       │   │
│  │  • Load all 34 audio assets                           │   │
│  │  • Register with Phaser.sound                         │   │
│  │                                                       │   │
│  │  Create Phase:                                        │   │
│  │  • Initialize sound objects                           │   │
│  │  • Set default volumes                                │   │
│  │  • Attach to window.soundManager                      │   │
│  │                                                       │   │
│  │  Runtime:                                             │   │
│  │  • Play/stop sounds                                   │   │
│  │  • Manage volumes (master + categories)               │   │
│  │  • Toggle enable/disable                              │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│         ┌───────────┼───────────────────┐                    │
│         ▼           ▼                    ▼                    │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐              │
│  │  Game      │ │ UI Sound   │ │   Game       │              │
│  │  Systems   │ │  Helpers   │ │   Events     │              │
│  │            │ │            │ │              │              │
│  │ Interact.  │ │ DOM attach │ │ Door knock   │              │
│  │ Unlock     │ │ Quick play │ │ Chair roll   │              │
│  │ Panels     │ │ Categorize │ │ Messages     │              │
│  └────────────┘ └────────────┘ └──────────────┘              │
│        │              │               │                      │
└────────┼──────────────┼───────────────┼──────────────────────┘
         │              │               │
         └──────────────┴───────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  Phaser Sound System        │
         │                            │
         │ • Sound pooling            │
         │ • 3D audio (reserved)       │
         │ • Effects & filters        │
         │ • Playback control         │
         └────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │   Web Audio API            │
         │   (Browser Native)         │
         │                            │
         │ • Decoding                 │
         │ • Mixing                   │
         │ • Output routing           │
         └────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  Audio Files (MP3)         │
         │  /assets/sounds/           │
         │                            │
         │ • 34 sounds total          │
         │ • GASP & custom effects    │
         └────────────────────────────┘
```

## Data Flow

### Sound Playback Flow
```
User Action (Click, Item pickup, etc.)
        │
        ▼
Event Handler
        │
        ▼
playUISound('click') / playGameSound('name')
        │
        ▼
UI Sound Helper (ui-sounds.js)
        │
        ▼
window.soundManager.play() or specific method
        │
        ▼
SoundManager retrieves Phaser sound object
        │
        ├─ Get volume from category settings
        ├─ Apply master volume multiplier
        └─ Call Phaser audio.play()
        │
        ▼
Phaser Sound Object
        │
        ▼
Web Audio API
        │
        ▼
Speaker Output
```

### Volume Cascade
```
Master Volume (0-1)
        │
        ├─ Category Volume: UI (0-1)
        │   └─ ui_click_1, ui_click_2, etc.
        │
        ├─ Category Volume: Interactions (0-1)
        │   └─ item_interact_*, lock_interact_*, door_knock
        │
        ├─ Category Volume: Notifications (0-1)
        │   └─ ui_alert_*, ui_notification_*, ui_reject
        │
        ├─ Category Volume: Effects (0-1)
        │   └─ lockpick_*, chair_roll, message_received
        │
        └─ Category Volume: Music (0-1)
            └─ (reserved for future use)

Final Volume = Master × Category × Sound
```

## Integration Points

### 1. Game Core
```
js/core/game.js
├─ preload()
│  ├─ Create SoundManager instance
│  └─ soundManager.preloadSounds()
│
└─ create()
   ├─ Create new SoundManager
   ├─ soundManager.initializeSounds()
   └─ window.soundManager = soundManager
```

### 2. Interaction System
```
js/systems/interactions.js
├─ Item Collection (3 places)
│  └─ playUISound('item')
│
└─ Event: Object interaction starts
   └─ playUISound('interaction')
```

### 3. Unlock System
```
js/systems/unlock-system.js
└─ handleUnlock()
   ├─ playUISound('lock')
   └─ Continues with unlock logic
```

### 4. UI/Panels
```
js/ui/panels.js
├─ showPanel()
│  └─ playUISound('notification')
│
└─ togglePanel()
   └─ playUISound('notification') if showing
```

### 5. Mini-Games
```
js/minigames/lockpicking/lockpicking-game-phaser.js
├─ preload()
│  ├─ load.audio('lockpick_binding')
│  ├─ load.audio('lockpick_click')
│  └─ ... (8 sounds)
│
└─ create()
   ├─ sound.add('lockpick_binding')
   └─ ... (store references)

Usage:
├─ Lock manipulation → sounds.click.play()
├─ Tension applied → sounds.tension.play()
├─ Pin set → sounds.set.play()
└─ Lock opened → sounds.success.play()
```

## Sound Categories & Volumes

```
┌─────────────┬──────────────┬─────────────────────────────┐
│ Category    │ Default Vol. │ Contains                     │
├─────────────┼──────────────┼─────────────────────────────┤
│ UI          │ 0.7          │ Clicks, confirms            │
│ Interact    │ 0.8          │ Items, locks, doors         │
│ Notif       │ 0.6          │ Alerts, notifications       │
│ Effects     │ 0.85         │ Game-specific effects       │
│ Music       │ 0.5          │ (Reserved)                  │
└─────────────┴──────────────┴─────────────────────────────┘
```

## Global Access Points

```javascript
// Main entry point
window.soundManager

// Methods
.play(soundName, options)
.stop(soundName)
.stopAll()
.playUIClick()
.playUINotification()
.playItemInteract()
.playLockInteract()
.setMasterVolume(vol)
.setCategoryVolume(cat, vol)
.toggle()
.setEnabled(bool)
.isEnabled()

// Via UI helpers
playUISound(type)      // 'click', 'notification', 'item', 'lock', etc.
playGameSound(name)    // Direct sound name
attachUISound(elem, type)
```

## Performance Characteristics

### Memory
- Audio preloaded but not decoded until first play
- Decoded audio cached by Phaser
- Estimate: ~2-4MB for all 34 sounds

### CPU
- Minimal CPU usage during playback
- Phaser handles efficient streaming
- Can play multiple sounds simultaneously

### Network
- All sounds loaded on game start
- ~1-2 seconds additional load time
- Typical: 2-5MB total download

## Error Handling

```
Try to play sound
    ├─ If soundManager exists
    │  ├─ If sound name exists
    │  │  └─ Play with category volume
    │  └─ If sound name missing
    │     └─ Warning: "Sound not found"
    └─ If soundManager missing
       └─ Warning: "Sound Manager not initialized"

Result: Graceful degradation, game continues
```

## Testing Checklist

```
┌─ Load Phase
│  ├─ All 34 sounds preload successfully
│  └─ No 404 errors in console
│
├─ Init Phase
│  ├─ window.soundManager exists
│  └─ All 34 sounds initialized
│
├─ Playback
│  ├─ Item pickup plays sound
│  ├─ Lock attempt plays sound
│  ├─ UI panel open plays sound
│  ├─ Lockpicking sounds work
│  └─ All random variants play
│
├─ Volume Control
│  ├─ Master volume works
│  ├─ Category volumes work
│  └─ Mix adjusts correctly
│
├─ State Management
│  ├─ Toggle on/off works
│  ├─ Enable/disable works
│  └─ Stop all works
│
└─ Performance
   ├─ No audio lag
   ├─ No memory leaks
   └─ Smooth playback
```
