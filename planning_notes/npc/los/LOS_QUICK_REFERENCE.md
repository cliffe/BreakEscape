# LOS Visualization - Quick Reference

## 30-Second Quick Start

```javascript
// 1. Open game in browser
// 2. Open console (F12)
// 3. Paste this:
window.enableLOS()

// You should now see green cones!
```

## Visual Elements Explained

```
                    ↑ Facing Direction
                    |
              ......|......  Range Circle (max detection distance)
            ./     .│.     \.
           /       . │ .      \
          /       .  │  .      \
         /       .   │   .      \
        /   ===  .   │   .  ===   \
       /  /       \  │  /       \   \
      /  /         \ │ /         \   \
     /  /     NPC   \│/           \   \
    /  /      ●      ●             \   \  ← Angle Wedge (cone boundary)
    \  \             │             /   /
     \  \            │            /   /
      \  \          ╱ ╲          /   /
       \  \        ╱   ╲        /   /
        \  ╲      ╱     ╲      ╱   /
         \  ╲    ╱       ╲    ╱   /
          \  ╲  ╱         ╲  ╱   /
           \  ╱            ╱  /
            ╲/            ╱  ╱
              ╲╱╲    ╱╲╱   ╱
                 ╲  ╱  ╲  ╱
                  ╲╱    ╲╱
                   
● = NPC Position Marker (bright circle)
█ = Filled Cone (player detection zone)
⟨ = Range Boundary Circle
↑ = Facing Direction Arrow
```

## Console Commands

| Command | Effect |
|---------|--------|
| `window.enableLOS()` | Show green cones |
| `window.disableLOS()` | Hide cones |
| `window.npcManager.losVisualizationEnabled` | Check if enabled (true/false) |
| `window.npcManager.npcs.size` | Count of NPCs |
| `window.npcManager.losVisualizations.size` | Count of visible cones |

## Color Guide

| Color | Meaning |
|-------|---------|
| **Bright Green (100%)** | NPC position marker and facing arrow |
| **Medium Green (80%)** | Cone outline/border |
| **Light Green (60%)** | NPC circle marker |
| **Faint Green (20%)** | Range circle boundary |
| **Very Faint (10%)** | Angle wedge lines |

## Console Output Examples

### ✅ Everything Working

```
👁️ Enabling LOS visualization
🎯 Updating LOS visualizations for 2 NPCs
   Processing "guard1" - has LOS config {range: 300, angle: 140}
🟢 Drawing LOS cone for NPC at (1200, 850), range: 300, angle: 140°
   NPC facing: 0°
✅ LOS cone drawn at (1200, 850) with depth: -999
   ✅ Created visualization for "guard1"
✅ LOS visualization update complete: 2/2 visualized
```

### ❌ NPC Not Found

```
🔴 Cannot draw LOS cone - NPC position not found
{npcId: "guard1", hasSprite: false, hasX: true, hasPosition: false}
```

**Solution**: Verify NPC sprite is initialized before calling `enableLOS()`

### ⚠️ Missing LOS Config

```
   Skip "guard1" - no LOS config or disabled
```

**Solution**: Add `"los": {"enabled": true, "range": 300, "angle": 140}` to NPC in scenario JSON

## Testing Scenarios

### Test 1: Basic Visualization
1. `window.enableLOS()`
2. Look for green cones on screen
3. Verify they point toward NPC's facing direction

### Test 2: Range Detection
1. Move player closer/farther from NPC
2. Watch for detection feedback in console
3. Verify player detected inside cone, outside range

### Test 3: Angle Detection
1. Move player left/right relative to NPC
2. Check if player is within cone angle boundaries
3. Verify detection changes as you move

### Test 4: Lockpicking Interruption
1. Try to pick a lock near an NPC
2. NPC should see you if in LOS
3. Person-chat should start instead of lockpicking
4. Check console for "NPC can see player" message

## Debugging Checklist

- [ ] Green cones appear when `enableLOS()` called
- [ ] Cones disappear when `disableLOS()` called
- [ ] Arrow points in NPC's facing direction
- [ ] Range circle matches configured range
- [ ] Cone angle matches configured angle
- [ ] NPC marker at correct position
- [ ] Console shows success messages (🟢)
- [ ] Lockpicking interrupted when in NPC view
- [ ] Person-chat starts instead of minigame

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No cones visible | Scene not ready | Wait 1 second after loading, then call `enableLOS()` |
| Cones invisible | Graphics behind terrain | Check console for rendering errors |
| Wrong cone position | NPC not initialized | Ensure NPC sprite exists before enabling |
| Detection not working | LOS config missing | Add `los` object to NPC in scenario JSON |
| Wrong facing direction | NPC facing not set | Set NPC `direction` or `rotation` property |

## Configuration Template

Add to any NPC in scenario JSON:

```json
"los": {
  "enabled": true,
  "range": 300,        // pixels - how far they can see
  "angle": 140,        // degrees - cone width
  "visualize": true    // show debug cone
}
```

## Performance Tips

- Each NPC cone: ~0.5ms per frame
- With 5 NPCs: ~2-3ms per frame (negligible)
- Visualization runs every frame when enabled
- Graphics depth set to -999 (behind everything)

## URLs & Files

| Resource | Path |
|----------|------|
| Test File | `test-los-visualization.html` |
| Debug Guide | `docs/LOS_VISUALIZATION_DEBUG.md` |
| System Docs | `docs/LOS_SYSTEM_OVERVIEW.md` |
| Source Code | `js/systems/npc-los.js` |

## Keyboard Shortcuts

None defined yet, but you can add:

```javascript
// In game loop or event listener:
if (key === 'L') window.enableLOS()
if (key === 'K') window.disableLOS()
```

## Viewing Console

1. Press **F12** to open Developer Tools
2. Click **Console** tab
3. Type commands like `window.enableLOS()`
4. Press **Enter**

## Getting Help

Check these in order:

1. Console output messages (look for 🔴 errors)
2. `docs/LOS_VISUALIZATION_DEBUG.md` (troubleshooting)
3. `docs/LOS_SYSTEM_OVERVIEW.md` (technical details)
4. Verify scenario JSON has correct NPC config
5. Check game loads successfully before enabling LOS
