# LOS Debugging - Quick Command Reference

## The Three Essential Commands

### 1. Test Graphics Rendering
```javascript
window.testGraphics()
```
- Creates a red square on screen for 5 seconds
- **If you see the red square**: Graphics rendering ✅
- **If you don't**: Graphics rendering broken ❌

### 2. Check System Status
```javascript
window.losStatus()
```
Shows:
- Number of NPCs loaded
- Whether visualization is enabled
- NPC positions
- NPC facing directions
- LOS configuration

### 3. Enable/Disable LOS
```javascript
window.enableLOS()    // Show green cones
window.disableLOS()   // Hide cones
```

---

## What the New Console Output Shows

### Distance and Angle Info

```
👁️ NPC "patrol_with_face" CANNOT see player
   Position: NPC(1200, 850) → Player(640, 360)
   Distance: 789.4px (range: 250px) ❌ TOO FAR
   Angle to Player: 235.5° (FOV: 120°)
```

| Field | Meaning |
|-------|---------|
| Distance | Pixels between NPC and player. Must be ≤ range. |
| Range | Configured detection distance from scenario |
| Angle to Player | Direction to player in degrees (0°=East, 90°=South) |
| FOV | Field of view. Player must be within ±(FOV/2) degrees |

---

## Expected Results

### When Graphics Work ✅
```
🧪 Testing graphics rendering...
✅ Drew red square at (100, 100)
   If you see a RED SQUARE on screen, graphics rendering is working!
```
**You should see a red square for 5 seconds**

### When LOS Works ✅
```
🟢 Drawing LOS cone for NPC at (1200, 850), range: 250, angle: 120°
   📊 Graphics object created: {graphicsExists: true...}
   ⭕ Range circle drawn at (1200, 850) radius: 250
✅ LOS cone rendered successfully: {depth: -999, alpha: 1, visible: true...}
```
**You should see green cones on screen**

### When NPC Detects Player ✅
```
Distance: 157.5px (range: 250px) ✅ in range
Angle to Player: 45° (FOV: 120°) ✅ within range
```
**Player should be detected and person-chat should trigger**

---

## Troubleshooting Flow

```
1. Run: window.testGraphics()
   └─ See red square? → YES → Go to step 2
      └─ See red square? → NO → Graphics broken! Stop here.

2. Run: window.losStatus()
   └─ NPCs loaded > 0? → YES → Go to step 3
      └─ NPCs loaded > 0? → NO → NPCs not loaded!

3. Run: window.enableLOS()
   └─ See green cones? → YES → LOS works! ✅
      └─ See green cones? → NO → Go to step 4

4. Check console output:
   └─ "🔴 Cannot draw LOS cone"? → Check error details
      └─ "✅ LOS cone rendered"? → Should see cones (rendering issue)
```

---

## Key Metrics to Check

### System Status (`window.losStatus()`)

```
NPCs loaded: 2              ← Should be > 0
Graphics objects: 2         ← Should match NPCs count when enabled
LOS enabled: true          ← Should be true after enableLOS()
```

### LOS Detection

```
Distance: 157.5px (range: 250px) ✅ in range
                   └─ Distance < Range = IN RANGE
                   
Angle to Player: 45° (FOV: 120°) ✅ within range
                 └─ Angle < FOV/2 = IN FOV
```

Both must be ✅ for detection to work.

---

## Console Icon Guide

| Icon | Meaning |
|------|---------|
| 🧪 | Testing/Diagnostic |
| 📊 | Status/Information |
| ⭕ | Range circle drawn |
| 🟢 | Drawing/Creating |
| ✅ | Success |
| ❌ | Failure/Out of range |
| 🔴 | Error |
| 👁️ | LOS detection check |
| 📡 | System status |

---

## Common Scenarios

### "Can't see any green cones"

1. Run: `window.testGraphics()`
2. If red square appears:
   - Cones exist but not visible (depth/alpha issue)
   - Run: `window.losStatus()` - check Graphics objects count
   - If count is 0: visualization never ran
   - If count > 0: graphics created but not rendering
3. If red square doesn't appear:
   - Graphics rendering broken
   - Check browser console for JS errors

### "NPC says player out of range"

1. Run: `window.losStatus()` - check NPC position
2. Move player next to NPC and check distance:
   - Should see distance value in console
   - If distance > range: move closer
   - If distance < range: check angle next
3. Check angle:
   - Should show angle to player
   - If angle > FOV/2: move in front of NPC

---

## Quick Diagnostics

**Is graphics rendering working?**
```javascript
window.testGraphics()  // Red square should appear
```

**How many NPCs are loaded?**
```javascript
window.losStatus()     // Check "NPCs loaded:" line
```

**Why isn't the cone showing?**
```javascript
window.enableLOS()     // Check console for 🔴 errors
window.losStatus()     // Check "Graphics objects:" count
```

**Why doesn't NPC see player?**
```javascript
// Move player near NPC and check console for:
// Distance: XXXpx (range: YYYpx) ← Distance < Range?
// Angle to Player: AAA° (FOV: BBB°) ← Angle < FOV/2?
```

---

## Copy-Paste Commands

```javascript
// Test graphics
window.testGraphics()

// Check status
window.losStatus()

// Enable LOS
window.enableLOS()

// Disable LOS
window.disableLOS()

// Watch NPC position every 100ms
setInterval(() => {
    const npc = Array.from(window.npcManager.npcs.values())[0];
    if (npc && npc.sprite) {
        const pos = npc.sprite.getCenter();
        console.log(`NPC: (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);
    }
}, 100);
```

---

## Success Checklist

- [ ] Red square test passes
- [ ] NPCs showing in losStatus()
- [ ] LOS enabled in losStatus()
- [ ] Green cones visible on screen
- [ ] Console shows no 🔴 errors
- [ ] Distance/angle logged when moving player
- [ ] Person-chat triggers when in LOS

**All checked? System is working! ✅**
