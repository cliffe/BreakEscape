# LOS Debugging Enhancements - Implementation Summary

## ✅ What Was Added

### 1. Distance and Angle Logging in Console

**File Modified:** `js/systems/npc-manager.js`

When NPCs check for player detection, console now shows:

```
👁️ NPC "patrol_with_face" CANNOT see player
   Position: NPC(1200, 850) → Player(640, 360)
   Distance: 789.4px (range: 250px) ❌ TOO FAR
   Angle to Player: 235.5° (FOV: 120°)
```

**Details provided:**
- NPC and player exact positions
- Actual distance between them
- Configured detection range
- Player angle relative to NPC
- Visual indicators (✅/❌) for success/failure

---

### 2. New Console Test Functions

**File Modified:** `js/main.js`

#### Graphics Rendering Test
```javascript
window.testGraphics()
```

Creates a red square on screen for 5 seconds to test if graphics rendering works.

**Console output:**
```
🧪 Testing graphics rendering...
✅ Created graphics object: {exists: true, hasScene: true, depth: 0, alpha: 1, visible: true}
✅ Drew red square at (100, 100)
   If you see a RED SQUARE on screen, graphics rendering is working!
```

**Purpose:** Isolate graphics issues from LOS system issues

---

#### System Status Viewer
```javascript
window.losStatus()
```

Shows complete LOS system health and configuration.

**Console output:**
```
📡 LOS System Status:
   Enabled: true
   NPCs loaded: 2
   Graphics objects: 2
   NPC: "patrol_with_face"
      LOS enabled: true
      Position: (1200, 850)
      Facing: 0°
   NPC: "security_guard"
      LOS enabled: true
      Position: (1200, 800)
      Facing: 90°
```

**Provides:** Instant system health check, NPC positions, configurations

---

### 3. Enhanced Graphics Creation Logging

**File Modified:** `js/systems/npc-los.js`

Now shows detailed information during cone creation:

```
🟢 Drawing LOS cone for NPC at (1200, 850), range: 250, angle: 120°
   NPC facing: 0°
   📊 Graphics object created - checking properties: {graphicsExists: true, hasScene: true, sceneKey: "main", canAdd: true}
   ⭕ Range circle drawn at (1200, 850) radius: 250
✅ LOS cone rendered successfully: {positionX: "1200", positionY: "850", depth: -999, alpha: 1, visible: true, active: true, pointsCount: 20}
```

**New information:**
- Graphics object properties verification
- Scene reference validation
- Range circle rendering confirmation
- Complete render status (depth, alpha, visibility, point count)

---

## 📚 New Documentation

Created 4 comprehensive debugging guides:

1. **`LOS_QUICK_COMMANDS.md`**
   - Quick reference for all commands
   - Expected outputs
   - One-page troubleshooting

2. **`LOS_DEBUGGING_IMPROVEMENTS.md`**
   - Detailed explanation of improvements
   - Before/after examples
   - Use case scenarios

3. **`docs/LOS_ENHANCED_DEBUG_GUIDE.md`**
   - Complete debugging workflow
   - Step-by-step troubleshooting
   - Performance monitoring tips

4. **`docs/LOS_VISUALIZATION_DEBUG.md`** (updated)
   - Enhanced with new commands
   - Added test procedures
   - Includes new console output examples

---

## 🔍 Debugging Workflow

### Three-Step Quick Check

```javascript
// 1. Test graphics rendering
window.testGraphics()

// 2. Check system status
window.losStatus()

// 3. Enable LOS visualization
window.enableLOS()
```

**Expected results:**
1. Red square appears on screen
2. Console shows 2 NPCs with positions
3. Green cones appear on screen, detailed logs show

---

## 📊 Console Output Interpretation Guide

### Distance Check

```
Distance: 789.4px (range: 250px) ❌ TOO FAR
```

- **789.4px** = Actual distance between NPC and player
- **250px** = Configured detection range
- **❌ TOO FAR** = Player outside detection radius (789 > 250)

**Resolution:** Move player closer to NPC

---

### Angle Check

```
Angle to Player: 235.5° (FOV: 120°)
```

- **235.5°** = Direction to player (0°=East, 90°=South, 180°=West, 270°=North)
- **120°** = Field of view (±60° around facing direction)

**To understand if in FOV:**
```
Facing: 0° (East)
Angle to Player: 45° (Northeast)
Is 45° within ±60° of 0°? YES → In FOV ✅
```

---

## ✅ What Gets Tested

### `window.testGraphics()`

Tests:
- Scene exists and is active
- Graphics API available
- Can create graphics objects
- Can draw shapes
- Rendering is working

**If this fails:** Graphics system is broken, LOS won't work either

---

### `window.losStatus()`

Shows:
- Whether LOS visualization is enabled
- How many NPCs are loaded
- How many graphics objects exist
- Each NPC's position and configuration

**Useful for:** Quick health check before testing

---

### `window.enableLOS()` (Enhanced)

Now shows:
- Each step of the setup process
- Graphics object creation details
- Range circle drawing confirmation
- Render property verification
- NPC-by-NPC status

**Useful for:** Seeing exactly where visualization fails, if at all

---

## 🎯 Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| Distance info | No | ✅ Exact distance logged |
| Angle info | No | ✅ Angle to player logged |
| Graphics test | No | ✅ `testGraphics()` function |
| Status check | Partial | ✅ Complete `losStatus()` |
| Creation logs | Basic | ✅ Detailed step-by-step |
| Error messages | Generic | ✅ Specific and actionable |

---

## 🚀 Usage Examples

### Find Why NPC Doesn't Detect

```javascript
// Move player next to NPC
// Check console for:

👁️ NPC "patrol_with_face" CANNOT see player
   Position: NPC(1200, 850) → Player(1250, 875)
   Distance: 58.3px (range: 250px) ✅ in range
   Angle to Player: 15.2° (FOV: 120°)
   
// Interpretation:
// - Distance OK (58px < 250px) ✅
// - Angle OK (15° within ±60°) ✅
// - Both checks pass!
// - If still not detecting, check other factors
```

---

### Debug No Green Cones

```javascript
// 1. First test graphics
window.testGraphics()

// Expected: Red square appears on screen

// 2. If red square shows, check LOS status
window.losStatus()

// Expected:
// Graphics objects: 2 (or more)
// NPCs loaded: 2 (or more)

// 3. If counts are 0, check enable logs
window.enableLOS()

// Expected in console:
// 🟢 Drawing LOS cone...
// 📊 Graphics object created...
// ✅ LOS cone rendered successfully...

// If you see these but no cones on screen:
// → Graphics rendering issue
// → Check graphics depth: -999 (should be visible)
// → Check alpha: 1 (should be opaque)
```

---

## 📋 Debugging Checklist

When LOS isn't working:

- [ ] Run `window.testGraphics()` - red square appears?
- [ ] Run `window.losStatus()` - NPCs loaded > 0?
- [ ] Run `window.enableLOS()` - any 🔴 errors?
- [ ] Check console for graphics creation logs
- [ ] Verify green cones visible on screen
- [ ] Move player and check distance/angle logs
- [ ] Verify angle within ±FOV/2 of facing direction
- [ ] Check if person-chat triggers when in range

---

## 🎓 Console Commands Reference

```javascript
// Enable LOS visualization with detailed logging
window.enableLOS()

// Disable visualization
window.disableLOS()

// Test if graphics rendering works
window.testGraphics()

// Check LOS system status
window.losStatus()

// Watch NPC position in real-time (every 100ms)
setInterval(() => {
    const npc = Array.from(window.npcManager.npcs.values())[0];
    if (npc?.sprite) {
        const pos = npc.sprite.getCenter();
        console.log(`NPC at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);
    }
}, 100);
```

---

## 📝 Files Modified

1. **`js/systems/npc-manager.js`**
   - Enhanced `shouldInterruptLockpickingWithPlayerPosition()` method
   - Added distance, angle, and position logging
   - Now shows detailed debug info per NPC check

2. **`js/systems/npc-los.js`**
   - Enhanced `drawLOSCone()` function
   - Added graphics object property logging
   - Added rendering status details
   - Improved error messages

3. **`js/main.js`**
   - Added `window.testGraphics()` function
   - Added `window.losStatus()` function
   - Enhanced `window.enableLOS()` with better scene discovery
   - Improved error messages for missing scene

---

## 🎯 Success Metrics

✅ **Can see red square** = Graphics rendering works
✅ **`losStatus()` shows NPCs** = NPCs loaded correctly
✅ **`enableLOS()` shows no 🔴 errors** = Visualization created
✅ **Green cones visible** = Rendering to screen works
✅ **Console shows distance/angle** = Detection working
✅ **✅ in range indicators** = Player in detection range

---

## 🔧 Next Steps

1. **Load scenario** - `npc-patrol-lockpick.json`
2. **Open console** - F12 → Console tab
3. **Run tests**:
   ```javascript
   window.testGraphics()    // Red square should appear
   window.losStatus()       // Should show 2 NPCs
   window.enableLOS()       // Green cones should appear
   ```
4. **Check console** for detailed output and debug info
5. **Move player** near NPC and watch distance/angle logs
6. **Verify** person-chat triggers when in LOS range

---

## 💡 Tips

- All commands output to browser console (F12)
- Look for icons (✅/❌/🔴) to identify issues
- Distance/angle appear when NPC checks for player
- Graphics test shows rendering capability
- Status command is safe to run anytime

The system is now fully debuggable! 🎉
