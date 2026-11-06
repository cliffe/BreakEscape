# Enhanced LOS Debugging - What's New

## Summary of Improvements

### 1. Enhanced Distance/Angle Logging ✅

**Before:**
```
👁️ NPC "patrol_with_face" cannot see player - out of LOS range/angle
```

**After:**
```
👁️ NPC "patrol_with_face" CANNOT see player
   Position: NPC(1200, 850) → Player(640, 360)
   Distance: 789.4px (range: 250px) ❌ TOO FAR
   Angle to Player: 235.5° (FOV: 120°)
```

**Information provided:**
- Exact NPC and player positions
- Actual distance vs configured range (with status indicator)
- Angle to player in degrees
- Field of view setting

---

### 2. New Console Test Commands ✅

#### `window.testGraphics()`

Tests if Phaser graphics rendering works by drawing a red square:

```javascript
window.testGraphics()
```

**Output:**
```
🧪 Testing graphics rendering...
📊 Scene: main Active: true
✅ Created graphics object: {exists: true, hasScene: true, depth: 0, alpha: 1, visible: true}
✅ Drew red square at (100, 100)
   If you see a RED SQUARE on screen, graphics rendering is working!
   If NOT, check browser console for errors
```

**What it does:**
- Creates graphics object
- Draws red square at (100, 100)
- Shows for 5 seconds then cleans up
- Logs detailed properties

---

#### `window.losStatus()`

Shows complete LOS system status:

```javascript
window.losStatus()
```

**Output:**
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
- Visualization enabled status
- Number of NPCs loaded
- Number of graphics objects rendered
- Per-NPC: Position, LOS config, facing direction

---

### 3. Enhanced Cone Drawing Logs ✅

**Before:**
```
🟢 Drawing LOS cone for NPC at (1200, 850), range: 250, angle: 120°
   NPC facing: 0°
✅ LOS cone drawn at (1200, 850) with depth: -999
```

**After:**
```
🟢 Drawing LOS cone for NPC at (1200, 850), range: 250, angle: 120°
   NPC facing: 0°
   📊 Graphics object created - checking properties: {graphicsExists: true, hasScene: true, sceneKey: "main", canAdd: true}
   ⭕ Range circle drawn at (1200, 850) radius: 250
✅ LOS cone rendered successfully: {positionX: "1200", positionY: "850", depth: -999, alpha: 1, visible: true, active: true, pointsCount: 20}
```

**New information:**
- Graphics object creation status
- Scene verification
- Range circle drawing confirmation
- Detailed render properties (depth, alpha, visibility, point count)

---

## Files Modified

### `js/systems/npc-manager.js`
- Enhanced `shouldInterruptLockpickingWithPersonChat()` method
- Now logs: Distance, Player position, NPC position, Angle to player
- Shows visual indicators (✅/❌) for in-range/out-of-range

### `js/systems/npc-los.js`
- Added graphics object property logging
- Added range circle drawing confirmation
- Added detailed render status output
- Shows point count and all render properties

### `js/main.js`
- Added `window.testGraphics()` - Graphics rendering test
- Added `window.losStatus()` - System status viewer
- Added detailed scene discovery logging
- Improved error messages

---

## Usage Examples

### Example 1: Test if Graphics Work

```javascript
> window.testGraphics()
🧪 Testing graphics rendering...
✅ Drew red square at (100, 100)
   If you see a RED SQUARE on screen, graphics rendering is working!
```

**Expected:** See red square on screen for 5 seconds

---

### Example 2: Check System Health

```javascript
> window.losStatus()
📡 LOS System Status:
   Enabled: false
   NPCs loaded: 2
   Graphics objects: 0
   NPC: "patrol_with_face"
      LOS enabled: true
      Position: (1200, 850)
      Facing: 0°
```

**Now enable and check again:**

```javascript
> window.enableLOS()
> window.losStatus()
📡 LOS System Status:
   Enabled: true
   NPCs loaded: 2
   Graphics objects: 2  ← Count increased!
```

---

### Example 3: Debug Distance Issue

**Scenario:** NPC not detecting player

1. Move player next to NPC
2. Check console:

```
👁️ NPC "patrol_with_face" CANNOT see player
   Position: NPC(1200, 850) → Player(1250, 875)
   Distance: 58.3px (range: 250px) ✅ in range
   Angle to Player: 15.2° (FOV: 120°) ← Check this value
```

**Analysis:**
- Distance OK (58px < 250px range)
- Angle OK (15° < 60° half-FOV)
- Should be detected! Check if LOS visualization shows green

---

## Console Icon Guide

| Icon | Meaning | Example |
|------|---------|---------|
| 🧪 | Test/Diagnostic | `Testing graphics rendering...` |
| 📊 | Status/Details | `Graphics object created` |
| ⭕ | Range indicator | `Range circle drawn` |
| 🟢 | Creating/Drawing | `Drawing LOS cone` |
| ✅ | Success | `LOS cone rendered successfully` |
| ❌ | Failure/Out | `TOO FAR` / `out of range` |
| 🔴 | Critical Error | `Cannot draw LOS cone` |
| 👁️ | LOS Detection | `NPC cannot see player` |
| 📡 | System Info | `LOS System Status` |

---

## Debugging Workflow

### Quick 3-Step Check

```javascript
// Step 1: Test graphics
window.testGraphics()  // Should show red square

// Step 2: Check status  
window.losStatus()     // Should show 2 NPCs

// Step 3: Enable LOS
window.enableLOS()     // Should show green cones
```

---

## Key Improvements

### Better Error Messages

**Old:**
```
👁️ NPC "patrol_with_face" cannot see player - out of LOS range/angle
```

**New:**
```
👁️ NPC "patrol_with_face" CANNOT see player
   Position: NPC(1200, 850) → Player(640, 360)
   Distance: 789.4px (range: 250px) ❌ TOO FAR
   Angle to Player: 235.5° (FOV: 120°)
```

### Isolated Graphics Testing

Can now test if graphics rendering works independent of LOS system:

```javascript
window.testGraphics()  // Draws simple red square
```

This helps identify if:
- Scene is working
- Graphics API is available
- Rendering is functioning

### Real-Time System Status

```javascript
window.losStatus()  // Shows everything about LOS system
```

Quickly see:
- How many NPCs loaded
- Are visualizations being rendered
- NPC positions and configurations

---

## Benefits

✅ **Faster Debugging** - See exact distance and angle values  
✅ **Better Diagnostics** - Test graphics independently  
✅ **Clear Status** - Know system health at a glance  
✅ **Detailed Logs** - Understand what's happening each step  
✅ **Visual Indicators** - Icons and colors guide interpretation  

---

## Common Debugging Scenarios Solved

### Scenario 1: "No green cones visible"

```javascript
// Before fix: Couldn't tell why
// After fix: 
window.testGraphics()   // Test graphics first
window.losStatus()      // Check graphics objects count
window.enableLOS()      // See detailed creation logs
```

Now you can pinpoint exact issue!

### Scenario 2: "NPC doesn't detect player"

```javascript
// Move player near NPC, then check:
// 👁️ NPC "patrol_with_face" CANNOT see player
//    Distance: 157.5px (range: 250px) ✅ in range
//    Angle to Player: 45° (FOV: 120°) 

// Now you know:
// - Distance is OK
// - Check angle (45° within 60°? YES!)
// - Why isn't it detecting?
```

Much clearer debugging!

---

## Testing Instructions

### Test 1: Graphics Rendering

```javascript
window.testGraphics()
```

Expected: Red square appears for 5 seconds

### Test 2: System Status

```javascript
window.losStatus()
```

Expected: Shows 2 NPCs with positions

### Test 3: Enable LOS

```javascript
window.enableLOS()
```

Expected: Green cones appear on screen

### Test 4: Check Detection

Move player near NPC and watch console for:
```
Distance: XXpx (range: 250px)
Angle to Player: XXX°
```

Expected: Shows accurate values

---

## Summary

With these enhancements, you can now:

1. ✅ **Test graphics independently** - Know if rendering works
2. ✅ **See exact distance/angle** - Understand why NPC detects or doesn't
3. ✅ **Check system health** - One command shows everything
4. ✅ **Debug faster** - Detailed logs at every step
5. ✅ **Understand issues** - Clear visual indicators and explanations

All output is in browser console - no special tools needed!
