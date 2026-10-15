# NPC Hostile State - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Game Loop (main.js)                       │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐   │
│  │   create()   │  │   update()    │  │  Event Listeners   │   │
│  └──────────────┘  └───────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                    │                        │
         │ Initialize         │ Update                 │ React to Events
         ▼                    ▼                        ▼
┌─────────────────┐  ┌─────────────────┐    ┌──────────────────┐
│  Health Systems │  │ Combat Systems  │    │   UI Systems     │
├─────────────────┤  ├─────────────────┤    ├──────────────────┤
│ Player Health   │  │ Player Combat   │    │ Player Health UI │
│ NPC Hostile     │  │ NPC Combat      │    │ NPC Health UI    │
│                 │  │ Combat Anims    │    │ Game Over UI     │
└─────────────────┘  └─────────────────┘    └──────────────────┘
         │                    │                        │
         └────────────────────┴────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  NPC Behaviors   │
                    ├──────────────────┤
                    │ Patrol (Normal)  │
                    │ Chase (Hostile)  │
                    │ Attack (Combat)  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │    LOS System    │
                    ├──────────────────┤
                    │ Player Detection │
                    │ Visual Range     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Ink Integration │
                    ├──────────────────┤
                    │ Tag Processing   │
                    │ Hostile Trigger  │
                    └──────────────────┘
```

## Core Systems

### 1. Health Management

**Player Health System** (`player-health.js`)
- **Responsibility**: Track player HP, damage, healing, KO state
- **Data**: Current HP (0-100), max HP, KO flag
- **Events Emitted**:
  - `player_hp_changed` - When HP changes
  - `player_ko` - When HP reaches 0
- **Used By**: Combat system, UI system, player controls

**NPC Hostile State System** (`npc-hostile.js`)
- **Responsibility**: Track hostile state and health for all NPCs
- **Data Structure**: Map of npcId → state object
  - `isHostile`: Boolean
  - `currentHP`: Number (0-maxHP)
  - `maxHP`: Number (configurable per NPC)
  - `isKO`: Boolean
  - `attackCooldown`: Number (ms)
  - `chaseTarget`: Reference to player
  - `attackDamage`: Number (configurable)
- **Events Emitted**:
  - `npc_hostile_state_changed` - When hostile state toggles
  - `npc_ko` - When NPC HP reaches 0
- **Used By**: Behavior system, combat system, UI system, Ink integration

### 2. Combat Systems

**Player Combat System** (`player-combat.js`)
- **Responsibility**: Handle player punching attacks
- **State**: Punch cooldown, isPunching flag
- **Process Flow**:
  1. Player inputs punch command (SPACE key)
  2. Check cooldowns and state
  3. Play punch animation (walk + red tint)
  4. Wait animation duration (500ms)
  5. Check target still in range
  6. Apply damage to NPC
  7. Update NPC health state
  8. Start cooldown
- **Dependencies**:
  - Animation system
  - NPC hostile system
  - Combat config
  - Player state

**NPC Combat System** (`npc-combat.js`)
- **Responsibility**: Handle NPC attacks on player
- **State**: Per-NPC attack cooldowns (in hostile state)
- **Process Flow**:
  1. NPC behavior detects player in range
  2. Check attack cooldown
  3. Stop NPC movement
  4. Play attack animation (walk + red tint)
  5. Wait animation duration
  6. Check player still in range
  7. Apply damage to player
  8. Update player health
  9. Start cooldown
  10. Resume NPC movement
- **Dependencies**:
  - Animation system
  - Player health system
  - NPC hostile system
  - Combat config

**Combat Animation System** (`combat-animations.js`)
- **Responsibility**: Play placeholder punch animations
- **Technique**: Reuse walk animations with red tint
- **Future**: Will be replaced with dedicated punch sprites
- **Functions**:
  - `playPlayerPunchAnimation()` - Returns promise
  - `playNPCPunchAnimation()` - Returns promise
  - Both handle tinting, animation, and cleanup

### 3. Behavior System Integration

**NPC Behavior Manager** (`npc-behavior.js` - MODIFIED)

Current behavior modes:
- **Normal Mode**: Patrol within bounds, face player
- **Hostile Mode** (NEW): Chase player, attack when in range

**Hostile Behavior Flow**:
```
┌─────────────────────────┐
│  NPC Becomes Hostile    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Enable LOS (360°)      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Is Player in LOS?      │
└────┬──────────────┬─────┘
     │ Yes          │ No
     ▼              ▼
┌─────────────┐  ┌─────────────┐
│ Chase Player│  │ Keep Patrol │
└──────┬──────┘  └─────────────┘
       │
       ▼
┌──────────────────────┐
│ Distance < Attack?   │
└──┬──────────────┬────┘
   │ Yes          │ No
   ▼              ▼
┌──────────┐  ┌──────────┐
│  Attack  │  │ Continue │
└──────────┘  └──────────┘
```

**Integration Points**:
1. `updateNPCBehaviors()` - Check hostile state before behavior
2. `updateHostileBehavior()` - NEW function for chase/attack
3. `moveNPCTowardsTarget()` - NEW function using pathfinding
4. Uses existing pathfinding system

### 4. Line of Sight (LOS) System

**LOS for Hostile NPCs** (`npc-los.js` - EXTENDED)

**Current System**:
- Detects player in cone-shaped field of view
- Configurable range and angle
- Used for lockpicking detection

**Hostile Extensions**:
- Dynamic LOS enabling when NPC becomes hostile
- 360-degree vision for hostile NPCs (vs 120° normal)
- Continuous player tracking
- Integration with chase behavior

**New Functions**:
- `enableNPCLOS(npc, range, angle)` - Turn on LOS dynamically
- `setNPCLOSTracking(npc, isTracking)` - Toggle tracking mode

### 5. UI Systems

**Player Health UI** (`player-health-ui.js`)

Display Method:
- Heart icons above inventory
- 5 hearts maximum
- Full heart = 20 HP
- Half heart = 10 HP
- Empty heart = 0 HP

Example Displays:
- 100 HP: ❤️❤️❤️❤️❤️
- 70 HP: ❤️❤️❤️💔🖤
- 30 HP: ❤️💔🖤🖤🖤
- 10 HP: 💔🖤🖤🖤🖤

Visibility:
- Hidden when HP = 100 (full health)
- Shows when HP < 100
- Updates in real-time on damage/healing

**NPC Health Bar UI** (`npc-health-ui.js`)

Display Method:
- Phaser Graphics object above NPC sprite
- Green fill for current HP
- Red/black background
- White border
- 60x6 pixels
- Positioned 40px above sprite

Lifecycle:
- Created when NPC becomes hostile
- Updated when NPC takes damage
- Follows NPC movement (updated each frame)
- Destroyed when NPC is KO

**Game Over UI** (`game-over-ui.js`)

Display:
- Full-screen overlay
- Semi-transparent black background
- Centered content box
- "GAME OVER" message
- Restart button

Triggered:
- Player HP reaches 0
- Player becomes KO
- Player movement disabled

### 6. Ink Dialogue Integration

**Tag Processing** (`chat-helpers.js` - MODIFIED)

New Tag: `#hostile` or `#hostile:npcId`

**Processing Flow**:
```
Ink Story Reaches Hostile Path
      ↓
Tag: #hostile:security_guard
      ↓
processGameActionTags()
      ↓
processHostileTag(tag, ui)
      ↓
Extract NPC ID from tag
      ↓
npcHostileSystem.setNPCHostile(npcId, true)
      ↓
Emit 'npc_became_hostile' event
      ↓
Exit conversation (#exit_conversation)
      ↓
Player back in game world
      ↓
NPC begins hostile behavior
```

**Tag Usage in Ink**:
```ink
=== escalate_conflict ===
# speaker:security_guard
You've crossed the line! This is a lockdown!
# hostile:security_guard
# exit_conversation
-> END
```

**Security Guard Updates**:
- All paths use hub pattern or `#exit_conversation`
- Hostile paths trigger `#hostile` tag
- Conversation exits immediately after hostile trigger
- No more dead-end `-> END` without cleanup

## Data Flow Diagrams

### Player Damage Flow

```
NPC in Attack Range
      ↓
canNPCAttack() → true
      ↓
npcAttack(npcId, npc)
      ↓
Play Attack Animation (500ms)
      ↓
Check Player Still in Range
      ↓
damagePlayer(attackDamage)
      ↓
playerHP -= damage
      ↓
Emit 'player_hp_changed'
      ↓
updatePlayerHealthUI()
      ↓
Calculate Hearts from HP
      ↓
Render Hearts
      ↓
Check if HP <= 0
      ↓
setPlayerKO(true)
      ↓
Emit 'player_ko'
      ↓
showGameOver()
      ↓
Disable Player Movement
```

### NPC Becomes Hostile Flow

```
Player Chooses Hostile Dialogue Option
      ↓
Ink Reaches Hostile Knot
      ↓
Tag: #hostile:security_guard
      ↓
processHostileTag(tag, ui)
      ↓
setNPCHostile('security_guard', true)
      ↓
Update npcHostileStates Map
      ↓
Emit 'npc_became_hostile'
      ↓
Event Listener Triggered
      ↓
enableNPCLOS(npc, 400, 360)
      ↓
createNPCHealthBar(npcId, npc)
      ↓
Exit Conversation
      ↓
Update Loop Detects Hostile State
      ↓
Switch to updateHostileBehavior()
      ↓
Check Player in LOS
      ↓
If Yes: Chase Player
      ↓
If in Attack Range: Attack Player
```

### Player Punches NPC Flow

```
Player Near Hostile NPC
      ↓
Press SPACE Key
      ↓
canPlayerPunch() → true
      ↓
Get Facing Direction
      ↓
playPlayerPunchAnimation()
      ↓
Apply Red Tint + Walk Animation
      ↓
Wait 500ms
      ↓
Clear Tint + Return to Idle
      ↓
Check NPC Still in Range
      ↓
If Yes: damageNPC(npcId, damage)
      ↓
npcHP -= damage
      ↓
updateNPCHealthBar(npcId, currentHP, maxHP)
      ↓
Redraw Health Bar Fill
      ↓
Check if npcHP <= 0
      ↓
If Yes: setNPCKO(npcId, true)
      ↓
Emit 'npc_ko'
      ↓
replaceWithKOSprite(scene, npc)
      ↓
Gray Tinted + Rotated Sprite
      ↓
destroyNPCHealthBar(npcId)
      ↓
Disable NPC Behavior Updates
```

## Configuration System

**Central Configuration** (`combat-config.js`)

All combat parameters in one place for easy tuning:

```javascript
{
  player: {
    maxHP: 100,
    punchDamage: 20,
    punchRange: 60,
    punchCooldown: 1000
  },
  npc: {
    defaultMaxHP: 100,
    defaultPunchDamage: 10,
    chaseSpeed: 120,
    attackRange: 50
  },
  ui: {
    maxHearts: 5,
    healthBarWidth: 60,
    healthBarHeight: 6
  }
}
```

**Why Centralized?**
- Easy balancing and tuning
- Consistent values across systems
- No magic numbers in code
- Quick iteration during playtesting

## State Management

### Global State Extensions

**New Window Objects**:
- `window.playerHealth` - Player health system instance
- `window.npcHostileSystem` - NPC hostile state manager
- `window.playerCombat` - Player combat system
- `window.npcCombat` - NPC combat system
- `window.currentPunchTarget` - Currently targetable NPC for punch

**Existing State Used**:
- `window.player` - Player sprite reference
- `window.npcManager` - NPC registry
- `window.eventDispatcher` - Event bus
- `window.currentRoom` - Current room ID
- `window.pathfinders` - Pathfinding per room

## Event System

### New Events

| Event Name | Payload | Emitted By | Listeners |
|------------|---------|------------|-----------|
| `player_hp_changed` | `{ hp, maxHP }` | player-health.js | player-health-ui.js |
| `player_ko` | `{ }` | player-health.js | game-over-ui.js, player.js |
| `npc_hostile_state_changed` | `{ npcId, isHostile }` | npc-hostile.js | npc-behavior.js, npc-health-ui.js |
| `npc_became_hostile` | `{ npcId }` | chat-helpers.js | main.js (setup LOS, health bar) |
| `npc_ko` | `{ npcId }` | npc-hostile.js | npc-ko-sprites.js, npc-health-ui.js |

### Event Flow Example

```
Player Takes Damage
      ↓
damagePlayer(10)
      ↓
playerHP: 100 → 90
      ↓
eventDispatcher.emit('player_hp_changed', { hp: 90, maxHP: 100 })
      ↓
player-health-ui.js receives event
      ↓
updatePlayerHealthUI()
      ↓
calculateHearts(90) → 4.5 hearts
      ↓
Render: ❤️❤️❤️❤️💔
      ↓
showPlayerHealthUI() (was hidden at 100 HP)
```

## Module Dependencies

### Dependency Graph

```
main.js
  ├─> player-health.js
  │     └─> (no dependencies)
  │
  ├─> player-health-ui.js
  │     └─> player-health.js
  │
  ├─> npc-hostile.js
  │     └─> combat-config.js
  │
  ├─> npc-health-ui.js
  │     └─> npc-hostile.js
  │
  ├─> game-over-ui.js
  │     └─> (no dependencies)
  │
  ├─> player-combat.js
  │     ├─> player-health.js
  │     ├─> npc-hostile.js
  │     ├─> combat-animations.js
  │     └─> combat-config.js
  │
  ├─> npc-combat.js
  │     ├─> player-health.js
  │     ├─> npc-hostile.js
  │     ├─> combat-animations.js
  │     └─> combat-config.js
  │
  ├─> combat-animations.js
  │     └─> combat-config.js
  │
  ├─> npc-ko-sprites.js
  │     └─> (Phaser only)
  │
  └─> npc-behavior.js (MODIFIED)
        ├─> npc-hostile.js
        ├─> npc-los.js
        ├─> npc-pathfinding.js (existing)
        └─> combat-config.js
```

### Load Order

1. **Configuration** (no dependencies)
   - `combat-config.js`

2. **Core Systems** (config only)
   - `player-health.js`
   - `npc-hostile.js`

3. **Animation & Sprites**
   - `combat-animations.js`
   - `npc-ko-sprites.js`

4. **Combat Mechanics** (core + animation)
   - `player-combat.js`
   - `npc-combat.js`

5. **UI Systems** (core + combat)
   - `player-health-ui.js`
   - `npc-health-ui.js`
   - `game-over-ui.js`

6. **Behavior Extensions** (all above)
   - `npc-behavior.js` (modified)
   - `npc-los.js` (modified)

7. **Integration** (all above)
   - `interactions.js` (modified)
   - `player.js` (modified)
   - `chat-helpers.js` (modified)
   - `main.js` (modified)

## Performance Considerations

### Update Loop Optimization

**Every Frame**:
- Check hostile NPC interactions (limited to current room)
- Update NPC health bar positions (only for hostile NPCs)
- Player/NPC collision detection (existing)

**Throttled Updates** (existing 50ms):
- NPC behavior updates
- Pathfinding calculations

**On-Demand**:
- Health UI updates (only on HP change events)
- Game over screen (only on player KO)
- Hostile state changes (only via Ink tags or events)

### Memory Management

**Cleanup When**:
- NPC becomes KO → Destroy health bar graphics
- Player leaves room → Health bars for that room
- Game restarts → Reset all combat state

**Persistent State**:
- Hostile state per NPC (persists across rooms)
- Player HP (persists across rooms)
- NPC HP (persists while NPC exists)

### Optimization Strategies

1. **Lazy Initialization**: Health bars only created when hostile
2. **Event-Driven UI**: Updates only on state changes
3. **Spatial Partitioning**: Only check NPCs in current room
4. **Object Pooling**: Reuse graphics objects when possible
5. **Throttling**: Behavior updates at 50ms intervals

## Extension Points

### Future Enhancements

**Easy to Add**:
- Different NPC types with different HP/damage
- Weapons that modify player damage
- Power-ups that heal player
- Special attacks with different animations
- Block/dodge mechanics
- Combo system

**Requires More Work**:
- Multiplayer combat
- Ranged attacks
- Cover system
- Stealth kills
- Different damage types
- Status effects (stun, slow, etc.)

### Customization Per NPC

NPCs can be configured with custom combat stats:

```javascript
// In scenario JSON
{
  "id": "tough_guard",
  "hostile": {
    "maxHP": 150,
    "attackDamage": 15,
    "attackRange": 60,
    "chaseSpeed": 140
  }
}
```

System will use these values instead of defaults from config.

## Testing Strategy

### Unit Testing Focus

1. **Health Systems**
   - HP bounds checking (0-100)
   - Damage calculation
   - Healing calculation
   - KO state triggers

2. **Combat Systems**
   - Cooldown timers
   - Range checks
   - Animation timing
   - Damage application

3. **State Management**
   - Hostile state toggle
   - State persistence
   - State retrieval

### Integration Testing Focus

1. **Ink → Hostile State**
   - Tag processing
   - State update
   - Event emission

2. **Hostile → Behavior**
   - LOS activation
   - Chase logic
   - Attack triggers

3. **Combat → UI**
   - Health display updates
   - Health bar rendering
   - Game over trigger

### Manual Testing Focus

1. **Gameplay Feel**
   - Combat responsiveness
   - Animation clarity
   - Visual feedback
   - Difficulty balance

2. **Edge Cases**
   - Rapid attacks
   - Out-of-range attempts
   - Multiple hostile NPCs
   - Room transitions

## Security Considerations

### Input Validation

- Damage values clamped to reasonable ranges
- HP values bounded (0-max)
- NPC IDs validated before state access
- Cooldowns enforced client-side

### State Integrity

- HP cannot go negative
- HP cannot exceed max
- Cooldowns cannot be bypassed
- KO state immutable until reset

### Cheat Prevention

Not a focus for single-player game, but architecture allows:
- Server-authoritative HP (if multiplayer added)
- Damage verification
- Cooldown verification
- State synchronization

## Troubleshooting Guide

### Common Issues

**Hearts Not Showing**
- Check: HP < 100?
- Check: playerHealthUI initialized?
- Check: CSS z-index correct?
- Check: Event listener attached?

**NPC Not Chasing**
- Check: NPC is hostile?
- Check: LOS enabled?
- Check: Player in LOS range?
- Check: Pathfinder for room exists?

**Punch Not Working**
- Check: Near hostile NPC?
- Check: Cooldown finished?
- Check: Player not KO?
- Check: SPACE key bound?

**Health Bar Missing**
- Check: NPC is hostile?
- Check: Health bar created on hostile event?
- Check: Graphics visible in scene?
- Check: Positioned correctly?

### Debug Helpers

Add these to window for debugging:

```javascript
window.debugCombat = {
  getPlayerHP: () => window.playerHealth.getPlayerHP(),
  setPlayerHP: (hp) => window.playerHealth.setPlayerHP(hp),
  makeHostile: (npcId) => window.npcHostileSystem.setNPCHostile(npcId, true),
  getNPCState: (npcId) => window.npcHostileSystem.getNPCHostileState(npcId),
  showAllHealthBars: () => { /* force show all */ },
  resetCombat: () => { /* reset all combat state */ }
};
```

## Summary

This architecture provides:
- **Modular Design**: Each system has clear responsibilities
- **Event-Driven**: Loose coupling between systems
- **Extensible**: Easy to add new features
- **Configurable**: Tunable parameters for balancing
- **Testable**: Clear interfaces and dependencies
- **Performant**: Optimized update loops and cleanup
- **Maintainable**: Clear code organization and documentation
