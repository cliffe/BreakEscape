# NPC Behavior System - Quick Reference

## For Scenario Designers

### Basic Setup (Face Player Only - Default)

```json
{
  "id": "receptionist",
  "displayName": "Receptionist",
  "npcType": "person",
  "position": { "x": 5, "y": 3 },
  "spriteSheet": "hacker-red",
  "storyPath": "scenarios/ink/receptionist.json"
}
```

**Result**: NPC will automatically turn to face player when player is within 3 tiles (96px).

---

### Add Patrol Behavior

```json
{
  "id": "guard",
  "displayName": "Security Guard",
  "npcType": "person",
  "position": { "x": 5, "y": 3 },
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 80,
      "changeDirectionInterval": 4000
    }
  },
  "spriteSheet": "guard",
  "storyPath": "scenarios/ink/guard.json"
}
```

**Result**: NPC will wander randomly in the room, changing direction every 4 seconds. Will still face player when approached.

---

### Add Personal Space

```json
{
  "id": "nervous_npc",
  "displayName": "Nervous Employee",
  "npcType": "person",
  "position": { "x": 5, "y": 3 },
  "behavior": {
    "personalSpace": {
      "enabled": true,
      "distance": 48,
      "backAwaySpeed": 30,
      "backAwayDistance": 5
    }
  },
  "spriteSheet": "hacker",
  "storyPath": "scenarios/ink/nervous.json"
}
```

**Result**: NPC will back away slowly (5px at a time) if player gets within 48px (1.5 tiles), while still facing the player. NPC remains within interaction range.

---

### Start as Hostile

```json
{
  "id": "enemy_agent",
  "displayName": "Enemy Agent",
  "npcType": "person",
  "position": { "x": 5, "y": 3 },
  "behavior": {
    "hostile": {
      "defaultState": true,
      "influenceThreshold": -30
    }
  },
  "spriteSheet": "hacker-red",
  "storyPath": "scenarios/ink/enemy.json"
}
```

**Result**: NPC will have red tint from start. Can be changed via Ink tags.

---

## For Ink Story Writers

### Control Hostility

```ink
=== make_hostile ===
# hostile
You've gone too far!
-> END

=== make_friendly ===
# hostile:false
Okay, I forgive you.
-> hub
```

### Set Influence Score

```ink
=== gain_favour ===
# influence:25
I really appreciate your help!
-> hub

=== lose_favour ===
# influence:-50
I can't believe you did that.
-> hub
```

### Toggle Patrol

```ink
=== start_rounds ===
# patrol_mode:on
I'll be making my rounds now.
-> hub

=== stop_rounds ===
# patrol_mode:off
I'll stay here for now.
-> hub
```

### Adjust Personal Space

```ink
=== need_distance ===
# personal_space:128
Please keep your distance (4 tiles).
-> hub

=== no_personal_space ===
# personal_space:0
You can come closer now.
-> hub
```

---

## For Developers

### Register a Behavior

```javascript
// In game.js create() phase
window.npcBehaviorManager.registerBehavior(
  'npc_id',           // NPC identifier
  npcSprite,          // Phaser sprite reference
  behaviorConfig      // Config from scenario JSON
);
```

### Update Loop Integration

```javascript
// In game.js update() function
export function update(time, delta) {
  // ... existing updates ...
  
  if (window.npcBehaviorManager) {
    window.npcBehaviorManager.update(time, delta);
  }
}
```

### Control via Code

```javascript
// Set hostile state
window.npcGameBridge.setNPCHostile('guard', true);

// Set influence
window.npcGameBridge.setNPCInfluence('receptionist', 50);

// Toggle patrol
window.npcGameBridge.setNPCPatrol('guard', false);
```

---

## Configuration Defaults

| Property | Default Value | Description |
|----------|--------------|-------------|
| `facePlayer` | `true` | Turn to face player when nearby |
| `facePlayerDistance` | `96` | Distance (px) to start facing |
| `patrol.enabled` | `false` | Enable random patrolling |
| `patrol.speed` | `100` | Movement speed (px/s) |
| `patrol.changeDirectionInterval` | `3000` | Time (ms) between direction changes |
| `personalSpace.enabled` | `false` | Back away when player too close |
| `personalSpace.distance` | `48` | Min distance (px) - **smaller than interaction range** |
| `personalSpace.backAwaySpeed` | `30` | Speed when backing away (px/s) - **slow** |
| `personalSpace.backAwayDistance` | `5` | Back away distance per update (px) |
| `hostile.defaultState` | `false` | Start hostile |
| `hostile.influenceThreshold` | `-50` | Become hostile below this influence |

**Personal Space Design**: NPCs back away slowly (5px at a time) while facing the player. Distance is 48px (1.5 tiles), which is **smaller than the interaction range (64px / 2 tiles)**, so NPCs remain interactive while maintaining comfort.

---

## Distance Reference

| Tiles | Pixels | Use Case |
|-------|--------|----------|
| 1 | 32 | Very close (touching) |
| 1.5 | 48 | **Default personal space (stays interactive)** |
| 2 | 64 | **Interaction range (player can talk to NPC)** |
| 3 | 96 | Default face player range |
| 4 | 128 | Extended personal space |
| 5 | 160 | Hostile aggro range |
| 10 | 320 | One full room width |

---

## Behavior Priority

Behaviors are evaluated in priority order (highest first):

1. **Chase** (5) - Hostile chase (future)
2. **Flee** (4) - Hostile flee (future)
3. **Maintain Space** (3) - Back away from player
4. **Patrol** (2) - Random movement
5. **Face Player** (1) - Turn towards player
6. **Idle** (0) - Default standing

Higher priority behaviors override lower priority behaviors.

---

## Common Patterns

### Friendly NPC That Patrols

```json
{
  "behavior": {
    "patrol": { "enabled": true, "speed": 80 }
  }
}
```

### Skittish NPC (Personal Space)

```json
{
  "behavior": {
    "personalSpace": { 
      "enabled": true, 
      "distance": 96 
    }
  }
}
```

### Guard That Patrols Until Confronted

```json
{
  "behavior": {
    "patrol": { "enabled": true, "speed": 100 },
    "hostile": { "defaultState": false }
  }
}
```

**Ink Story**:
```ink
=== confrontation ===
# patrol_mode:off
# hostile
Stop right there!
-> combat
```

### NPC That Warms Up to Player

```json
{
  "behavior": {
    "personalSpace": { "enabled": true, "distance": 96 },
    "hostile": { "defaultState": false }
  }
}
```

**Ink Story**:
```ink
=== start ===
# influence:0
# personal_space:96
Stay back!
-> hub

=== make_friends ===
# influence:50
# personal_space:0
Okay, I trust you now.
-> hub
```

---

## Troubleshooting

### NPC Not Facing Player
- Check `facePlayer: true` in config
- Verify `facePlayerDistance` is large enough
- Check player is within range (use debug mode)

### NPC Not Patrolling
- Check `patrol.enabled: true`
- Verify NPC has collision body (immovable: false for movement)
- **Check patrol bounds include NPC starting position**
- Wall collisions automatically set up for patrolling NPCs

### NPC Not Backing Away
- Check `personalSpace.enabled: true`
- Verify `distance` is 48px (or custom value smaller than interaction range)
- Note: NPC should back away slowly while still facing player
- Ensure NPC has collision body

### NPC Backs Away Too Far
- Personal space distance should be **smaller than 64px** (interaction range)
- Default is 48px - NPC stays within interaction range
- Use `backAwayDistance: 5` for subtle 5px adjustments

### NPC Backs Into Wall and Gets Stuck
- Personal space behavior includes wall collision detection
- If NPC can't back away, it will just face the player
- This is normal behavior (no console spam expected)

### Hostile Tint Not Showing
- Check `hostile: true` set via config or tag
- Verify sprite exists and is visible
- Check console for errors

### Walk Animations Not Playing
- **CRITICAL**: Walk animations must be created in `npc-sprites.js` BEFORE behavior system starts
- See Phase 0 prerequisites in IMPLEMENTATION_PLAN.md
- Check console for "Animation not found" warnings
- System will fall back to idle animations if walk animations missing

### NPC Collision Box Issues
- **NPCs intentionally use (18x10) collision** - this is CORRECT
- Do not change to match player (15x10) - they're different by design
- Wider collision improves patrol hit detection

### RoomId Missing Errors
- Ensure `roomId` is added to NPC data during scenario initialization
- Check `rooms.js` initialization code
- RoomId needed for patrol bounds calculation

---

## Design Notes

### Personal Space Philosophy

Personal space distance (48px) is **intentionally smaller than interaction range (64px)**:

**Why?**
- Player can still interact with backing-away NPC
- NPC remains conversational while maintaining comfort distance
- More natural UX than breaking interaction entirely

**Future Enhancement:**
Could add `breakInteraction` flag for NPCs that back away beyond interaction range.

### NPC Collision vs Player Collision

**NPCs have WIDER collision boxes than player - this is intentional:**

```javascript
// NPC: 18px wide (better hit detection during patrol)
sprite.body.setSize(18, 10);
sprite.body.setOffset(23, 50);

// Player: 15px wide (tighter control for precise movement)
player.body.setSize(15, 10);
player.body.setOffset(25, 50);
```

**Do not "match player collision"** - the difference is by design.

---

## Debug Mode

Enable debug logging:

```javascript
// In browser console
window.NPC_BEHAVIOR_DEBUG = true;
```

Visualize behavior ranges (future feature - Phase 7):

```javascript
// In browser console
window.NPC_BEHAVIOR_DEBUG_VISUAL = true;
```

This will draw:
- Green circles for face player range
- Red circles for personal space range
- Yellow lines showing patrol targets

---

## Performance Tips

1. **Limit NPCs**: Keep < 10 NPCs with behaviors per room
2. **Disable when not visible**: Future enhancement
3. **Use lower update rates**: Default 50ms is good balance
4. **Simple patrol bounds**: Smaller areas = less collision checks

---

**Last Updated**: November 9, 2025  
**Version**: 3.0 (Implementation Ready)
