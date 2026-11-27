# LOS Visualization Debugging Guide - Enhanced Edition

## New Enhanced Logging Features

### 1. Distance and Angle Logging ✅

When NPCs check for lockpick detection, the console now shows:

```
👁️ NPC "patrol_with_face" CANNOT see player
   Position: NPC(1200, 850) → Player(640, 360)
   Distance: 789.4px (range: 250px) ❌ TOO FAR
   Angle to Player: 235.5° (FOV: 120°)
```

**Interpretation:**
- **Distance**: Shows actual distance vs configured range
- **Angle to Player**: Direction to player in degrees (0° = East, 90° = South, etc.)
- **FOV**: Field of view angle - player must be within ±60° of facing direction

---

## New Console Test Commands

### `window.testGraphics()`

Tests if graphics rendering is working by drawing a red square:

```javascript
window.testGraphics()
```

**What it does:**
1. Creates a graphics object in the current scene
2. Draws a red square at position (100, 100)
3. Shows it for 5 seconds
4. Logs detailed graphics object properties

**Expected output if working:**
```
🧪 Testing graphics rendering...
📊 Scene: main Active: true
✅ Created graphics object: {exists: true, hasScene: true, depth: 0, alpha: 1, visible: true}
✅ Drew red square at (100, 100)
   If you see a RED SQUARE on screen, graphics rendering is working!
   If NOT, check browser console for errors
```

**If it doesn't appear:**
- There's a rendering issue with the scene
- Check browser console for JavaScript errors
- Verify scene is active: `window.game.scene.scenes[0].isActive()`

---

### `window.losStatus()`

Shows detailed LOS system status:

```javascript
window.losStatus()
```

**Example output:**
```
📡 LOS System Status:
   Enabled: true
   NPCs loaded: 2
   Graphics objects: 0
   NPC: "patrol_with_face"
      LOS enabled: true
      Position: (1200, 850)
      Facing: 0°
   NPC: "security_guard"
      LOS enabled: true
      Position: (1200, 800)
      Facing: 90°
```

**Information shown:**
- `Enabled`: Whether visualization is currently active
- `NPCs loaded`: Total NPCs in the system
- `Graphics objects`: Currently rendered visualization cones
- Per-NPC details: Position, LOS config, facing direction

---

## Enhanced Debug Output When Enabling LOS

### Before (Limited Info)

```
👁️ Enabling LOS visualization
✅ LOS visualization enabled
```

### After (Detailed Steps)

```
🔍 enableLOS() called
   game: true
   game.scene: true
   scenes: 1
   mainScene: true main
   npcManager: true
🎯 Setting LOS visualization with scene: main
👁️ Enabling LOS visualization
🎯 Updating LOS visualizations for 2 NPCs
   Processing "patrol_with_face" - has LOS config {enabled: true, range: 250, angle: 120}
🟢 Drawing LOS cone for NPC at (1200, 850), range: 250, angle: 120°
   NPC facing: 0°
   📊 Graphics object created - checking properties: {graphicsExists: true, hasScene: true, sceneKey: "main", canAdd: true}
   ⭕ Range circle drawn at (1200, 850) radius: 250
✅ LOS cone rendered successfully: {positionX: "1200", positionY: "850", depth: -999, alpha: 1, visible: true, active: true, pointsCount: 20}
   ✅ Created visualization for "patrol_with_face"
...
✅ LOS visualization update complete: 2/2 visualized
✅ LOS visualization enabled
```

---

## Debugging Workflow

### Step 1: Test Graphics Rendering

```javascript
window.testGraphics()
```

**Expected:** Red square appears on screen for 5 seconds

**If red square doesn't appear:**
- Graphics rendering is broken
- Skip LOS testing for now
- Check browser console for errors

---

### Step 2: Check LOS System Status

```javascript
window.losStatus()
```

**Verify:**
- ✅ NPCs loaded > 0
- ✅ LOS enabled: true
- ✅ Each NPC has position
- ✅ Each NPC has LOS config enabled

---

### Step 3: Enable LOS Visualization

```javascript
window.enableLOS()
```

**Check console for:**
- ✅ Graphics objects created
- ✅ Each NPC gets a visualization
- ✅ Depth set to -999
- ✅ Visibility set to true

---

### Step 4: Move Player Near NPC

Walk player within 250px of any NPC and check console:

```
👁️ NPC "patrol_with_face" CANNOT see player
   Position: NPC(1200, 850) → Player(1350, 875)
   Distance: 157.5px (range: 250px) ✅ in range
   Angle to Player: 10.3° (FOV: 120°)
```

**Expected:** See detailed distance/angle info

---

## Console Commands Reference

| Command | Purpose | Output |
|---------|---------|--------|
| `window.enableLOS()` | Enable visualization | Shows setup steps, should show green cones |
| `window.disableLOS()` | Disable visualization | Cones disappear |
| `window.testGraphics()` | Test graphics rendering | Red square appears for 5s |
| `window.losStatus()` | Show system status | Lists NPCs, LOS config, positions |

---

## What to Look For

### Successful LOS Rendering

✅ Green cones appear on screen
✅ Console shows "✅ LOS cone rendered successfully"
✅ Each cone points in NPC's facing direction
✅ Range circle matches config (250-300px)

### Failed LOS Rendering

❌ No cones visible
❌ Red square test doesn't appear → Graphics broken
❌ `Graphics objects: 0` in losStatus()
❌ Errors in browser console

---

## Common Issues and Solutions

### Issue 1: Red Square Test Fails

**Problem:** `window.testGraphics()` doesn't show red square

**Cause:** Graphics rendering broken in this scene

**Solution:**
1. Check browser console for JavaScript errors
2. Verify scene is active: `window.game.scene.scenes[0].isActive()`
3. Try in different scenario
4. Check if Phaser graphics API is available

---

### Issue 2: LOS Visualization Not Showing

**Problem:** Graphics test works but LOS cones don't appear

**Causes:**
1. NPC not initialized at expected position
2. Graphics depth behind terrain
3. Visualization flag not being set

**Debug steps:**
1. Run `window.losStatus()` - check NPC positions
2. Check console for "🔴 Cannot draw LOS cone" errors
3. Verify NPCs have `los` config enabled
4. Check graphics properties: `depth`, `alpha`, `visible`

---

### Issue 3: NPC "Cannot See Player"

**Problem:** Distance/angle shows player in range but still "cannot see"

**Check:**
1. Is distance within range? (distance < range)
2. Is angle within FOV? (angle < FOV/2)
3. What's the facing direction?
4. Is LOS enabled in config?

**Example successful detection:**
```
Distance: 157.5px (range: 250px) ✅ in range
Angle: 45° (FOV: 120°) ✅ within 60° of facing
→ Should see player!
```

---

## Distance/Angle Calculation Explained

### Distance Check

```
distance = √((playerX - npcX)² + (playerY - npcY)²)
if distance ≤ range → Player in range ✅
```

Example: Player 150px from NPC, range 250px → ✅ In range

### Angle Check

```
angleToPlayer = atan2(playerY - npcY, playerX - npcX) * 180/π
fovHalf = angle / 2

if |angleToPlayer - facingDirection| ≤ fovHalf → In FOV ✅
```

Example: 
- Facing: 0° (East)
- Angle to player: 45° (Northeast)  
- FOV: 120° (±60° around facing)
- Is 45° within ±60° of 0°? YES ✅

---

## Performance Monitoring

Check how many graphics objects are being created:

```javascript
// Run this repeatedly to see if count changes
window.losStatus()
```

Should show:
- Initial: `Graphics objects: 2` (one per NPC)
- After disableLOS(): `Graphics objects: 0` (cleaned up)
- After enableLOS(): `Graphics objects: 2` (recreated)

If count keeps increasing without limit, there's a memory leak.

---

## Real-Time Debugging

### Watch Position Changes

```javascript
setInterval(() => {
    const npc = Array.from(window.npcManager.npcs.values())[0];
    const pos = npc.sprite.getCenter();
    console.log(`NPC at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);
}, 100);
```

### Watch LOS Detection

```javascript
setInterval(() => {
    window.losStatus();
}, 2000);
```

---

## Expected Console Output When Working

```
🧪 Testing graphics rendering...
✅ Drew red square at (100, 100)
   If you see a RED SQUARE on screen, graphics rendering is working!

🔍 enableLOS() called
   game: true
   mainScene: true main

👁️ Enabling LOS visualization
🟢 Drawing LOS cone for NPC at (1200, 850), range: 250, angle: 120°
   📊 Graphics object created: {graphicsExists: true, hasScene: true...}
   ⭕ Range circle drawn at (1200, 850) radius: 250
✅ LOS cone rendered successfully: {...}

📡 LOS System Status:
   Enabled: true
   NPCs loaded: 2
   Graphics objects: 2
```

---

## Troubleshooting Checklist

- [ ] Red square test appears on screen
- [ ] `losStatus()` shows 2+ NPCs with positions
- [ ] `losStatus()` shows LOS enabled for each NPC
- [ ] `enableLOS()` shows graphics objects created
- [ ] `enableLOS()` shows "rendered successfully" messages
- [ ] Green cones visible on screen
- [ ] Cones point in NPC's facing direction
- [ ] Moving player shows distance/angle in console
- [ ] No JavaScript errors in browser console

If all checkboxes pass → System working! ✅
If any fail → Check that section's troubleshooting above

---

## Still Having Issues?

1. **Check browser console** for red error messages
2. **Run** `window.testGraphics()` - graphics rendering test
3. **Run** `window.losStatus()` - system status
4. **Enable LOS** `window.enableLOS()` - look for errors
5. **Copy all console output** and review error messages
6. **Look for lines starting with:**
   - 🔴 = Error (blocking)
   - 🟡 = Warning (check this)
   - ✅ = Success (working)
   - 👁️ = LOS check result
