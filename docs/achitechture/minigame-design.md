# Minigame System Design Reference

A guide for designing and implementing new minigames that interact with global variables and respond to/trigger game events.

---

## Definition & Registration

All minigames are registered in `public/break_escape/js/minigames/index.js`:

```js
MinigameFramework.registerScene('lockpicking', LockpickingMinigamePhaser);
MinigameFramework.registerScene('pin', PinMinigame);
```

---

## Base Class

All minigames extend `MinigameScene` from `public/break_escape/js/minigames/framework/base-minigame.js`:

| Method | Purpose |
|---|---|
| `constructor(container, params)` | Receives config params |
| `init()` | Build UI in `this.gameContainer` |
| `start()` | Activate game logic |
| `complete(success)` | End game, triggers events + `onComplete` callback |
| `addEventListener()` | Tracked listener (auto-cleaned on `cleanup()`) |

---

## How Scenarios Reference Minigames

Objects in `scenario.json.erb` declare `lockType`, which the unlock system routes to the correct minigame via `public/break_escape/js/systems/minigame-starters.js`:

```json
{ "locked": true, "lockType": "pin", "requires": "2024" }
```

Supported lock types: `pin`, `key`, `password`, `biometric`

Custom/NPC-triggered minigames are called directly via `window.*MinigameFunction()` from Ink stories.

---

## Global Variables

| Operation | How |
|---|---|
| Read | `window.gameState.globalVariables['key']` |
| Write + emit event | `window.npcManager.setGlobalVariable('key', value)` |
| Direct write (no event) | `window.gameState.globalVariables['key'] = value` |

State is auto-synced to server every 30s via `public/break_escape/js/state-sync.js`.

Use `window.npcManager.setGlobalVariable()` when other systems (NPCs, scenario logic) should react to the change. Use direct write for internal minigame bookkeeping only.

---

## Event System

Central pub/sub via `window.eventDispatcher` (`public/break_escape/js/systems/npc-events.js`):

```js
window.eventDispatcher.on('eventName', callback);
window.eventDispatcher.emit('eventName', { data });
window.eventDispatcher.off('eventName', callback);
```

### Key Events

| Event | Data |
|---|---|
| `minigame_completed` | `{ minigameName, success, result }` |
| `minigame_failed` | `{ minigameName, success, result }` |
| `global_variable_changed:varName` | `{ name, value, oldValue }` |
| `room_entered:roomId` | `{ roomId, roomName }` |
| `room_exited` | `{ roomId }` |
| `door_unlocked` | `{ doorSprite, lockedState }` |
| `item_picked_up:type` | `{ sprite, itemName }` |
| `item_removed_from_scene` | — |
| `npc_ko:npcId` | `{ npcId }` |
| `npc_became_hostile` | `{ npcId, isHostile }` |
| `player_hp_changed` | `{ hp, maxHp }` |
| `player_ko` | — |
| `objective_set` | — |
| `task_completed` | — |

### Scenario-Side Event Mappings

NPCs can react to events via `eventMappings` in `scenario.json.erb`:

```json
{
    "eventPattern": "item_picked_up:lockpick",
    "onceOnly": true,
    "sendTimedMessage": { "delay": 1000, "message": "You got the lockpick!" }
}
```

---

## New Minigame Checklist

1. Extend `MinigameScene`, implement `init()` and `start()`, call `this.complete(success)` when done
2. Register it in `public/break_escape/js/minigames/index.js`
3. Add a starter helper in `public/break_escape/js/systems/minigame-starters.js` if triggered by object interaction
4. Use `window.npcManager.setGlobalVariable()` to write state that other systems should react to
5. Use `this.addEventListener(window.eventDispatcher, 'event', cb)` inside `start()` to react to game events — the base class handles cleanup automatically

---

## Example: Minigame Using Global Variables & Events

```js
import { MinigameScene } from '../framework/base-minigame.js';

export class MyMinigame extends MinigameScene {
    constructor(container, params) {
        super(container, params);
        this.difficulty = params.difficulty || 'medium';
    }

    init() {
        super.init(); // Sets up close button, header, containers
        // Build game UI in this.gameContainer
    }

    start() {
        super.start(); // Activates game and escape key handler

        // React to a global variable changing
        this.addEventListener(window.eventDispatcher, 'global_variable_changed:tutorial_mode', (data) => {
            if (data.value === true) this.enableTutorialHints();
        });

        // React to a game event
        this.addEventListener(window.eventDispatcher, 'npc_ko:guard_01', () => {
            this.unlockBonusObjective();
        });

        // Read current global state
        const attempts = window.gameState.globalVariables['my_minigame_attempts'] || 0;
        this.remainingAttempts = 3 - attempts;
    }

    handleSuccess() {
        // Write state so other systems react
        window.npcManager.setGlobalVariable('my_minigame_complete', true);
        this.complete(true);
    }

    handleFailure() {
        const attempts = (window.gameState.globalVariables['my_minigame_attempts'] || 0) + 1;
        window.npcManager.setGlobalVariable('my_minigame_attempts', attempts);
        this.complete(false);
    }
}
```

---

## Key File Locations

| Purpose | Path |
|---|---|
| Base minigame class | `public/break_escape/js/minigames/framework/base-minigame.js` |
| Framework manager | `public/break_escape/js/minigames/framework/minigame-manager.js` |
| Registration | `public/break_escape/js/minigames/index.js` |
| Starter helpers | `public/break_escape/js/systems/minigame-starters.js` |
| Unlock system | `public/break_escape/js/systems/unlock-system.js` |
| Event dispatcher | `public/break_escape/js/systems/npc-events.js` |
| Global variable mutations | `public/break_escape/js/systems/npc-manager.js` |
| State persistence | `public/break_escape/js/state-sync.js` |
| Combat events | `public/break_escape/js/events/combat-events.js` |
| Example minigame | `public/break_escape/js/minigames/biometrics/biometrics-minigame.js` |
