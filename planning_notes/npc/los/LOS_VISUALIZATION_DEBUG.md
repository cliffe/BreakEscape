# LOS Visualization Debug Guide

## Summary of Improvements

The LOS (Line-of-Sight) visualization system has been enhanced with:

1. **Enhanced Cone Visualization**:
   - Green filled cone showing NPC's field of view
   - Range circle showing maximum detection distance
   - Facing direction arrow
   - Bright circle at NPC position for easy identification
   - Angle wedge lines on sides of cone

2. **Improved Debugging Output**:
   - Console logs at every step of visualization creation
   - Detailed status in `_updateLOSVisualizations()` with NPC counts
   - Better error messages when visualization fails
   - Scene information logged when `enableLOS()` is called

3. **Better Scene Integration**:
   - Graphics rendered at depth -999 (behind everything)
   - Multiple position detection methods for NPCs
   - Robust error handling with fallback values

## How to Test

### Method 1: Using Test HTML File

Open the dedicated test file:
```
test-los-visualization.html
```

This file includes:
- Pre-configured LOS debug flag
- Debug panel with Enable/Disable buttons
- Live status indicators showing NPC count and visualization count

### Method 2: Using Console Commands

1. Load any scenario with NPCs (e.g., `npc-patrol-lockpick.json`)
2. Open browser console (F12)
3. Run:
   ```javascript
   window.enableLOS()
   ```
4. Watch console for detailed logs
5. To disable:
   ```javascript
   window.disableLOS()
   ```

### Method 3: Using URL Parameter

Add `?los=1` or `?debug-los` to the scenario URL:
```
http://localhost:8000/scenario_select.html?los=1
```

Then start the `npc-patrol-lockpick` scenario.

## What You Should See

When LOS visualization is active:

1. **Green Cones**: Semi-transparent green cones emanating from each NPC showing their field of view
2. **Range Circle**: Light green circle outline showing maximum detection range
3. **Direction Arrow**: Bright green arrow pointing in the direction the NPC is facing
4. **NPC Markers**: Bright circles at NPC positions
5. **Angle Wedges**: Lines on the left and right edges of the cone showing angle limits

## Console Output Explanation

### When Enabling LOS:
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
   Processing "patrol_with_face" - has LOS config {range: 250, angle: 120, visualize: true}
🟢 Drawing LOS cone for NPC at (1200, 850), range: 250, angle: 120°
   NPC facing: 0°
✅ LOS cone drawn at (1200.00, 850.00) with depth: -999
   ✅ Created visualization for "patrol_with_face"
   ...
✅ LOS visualization update complete: 2/2 visualized
✅ LOS visualization enabled
```

### When Detection Happens:
```
👁️ NPC "patrol_with_face" CAN see player at (640, 360) - distance: 612.81, in range (250)? false
```
or
```
👁️ NPC "patrol_with_face" CAN see player - distance: 150.23px, angle: 45°, within cone: ✅
```

## Troubleshooting

### Cones Not Visible

1. **Check Console Output**:
   - If you see "🔴 Cannot draw LOS cone", check the error details
   - If you see "🟢 Drawing LOS cone" but nothing appears, check depth settings

2. **Verify NPC Initialization**:
   ```javascript
   console.log(window.npcManager.npcs)
   ```
   Should show NPCs with `sprite` and `los` properties

3. **Check Scene State**:
   ```javascript
   const scene = window.game.scene.scenes[0];
   console.log('Scene:', scene.key, 'Active:', scene.isActive())
   ```

4. **Manual Test**:
   ```javascript
   // Manually draw a test cone
   const testNPC = Array.from(window.npcManager.npcs.values())[0];
   console.log('Test NPC:', testNPC);
   const scene = window.game.scene.scenes[0];
   // Should see cone appear
   ```

### Console Helpers

```javascript
// Enable LOS visualization
window.enableLOS()

// Disable LOS visualization
window.disableLOS()

// Check NPC manager state
window.npcManager.losVisualizationEnabled  // true/false
window.npcManager.losVisualizations.size   // number of graphics objects
window.npcManager.npcs.size                // total NPCs loaded
```

## Technical Details

### Files Modified

1. **`js/systems/npc-los.js`**:
   - Enhanced `drawLOSCone()` with range circle, direction arrow, angle wedges
   - Added comprehensive console logging
   - Set graphics depth to -999 for visibility
   - Increased segments from 8 to 12 for smoother cones

2. **`js/systems/npc-manager.js`**:
   - Enhanced `_updateLOSVisualizations()` with detailed logging
   - Shows NPC processing details and success/failure per NPC

3. **`js/main.js`**:
   - Enhanced `window.enableLOS()` with scene discovery and error checking
   - Better debug output for troubleshooting scene access

4. **`test-los-visualization.html`** (NEW):
   - Dedicated test file with debug panel
   - Real-time status indicators
   - One-click enable/disable buttons

## Performance Notes

- LOS visualization runs every frame when enabled
- Each NPC creates one graphics object (removed/recreated each frame)
- With 2-5 NPCs, performance impact should be minimal
- For large numbers of NPCs (>10), consider optimizing to update only when NPCs move

## Next Steps

If cones still don't appear after these improvements:

1. Check if `scene.add.graphics()` is working:
   ```javascript
   const test = window.game.scene.scenes[0].add.graphics();
   test.fillStyle(0xff0000, 0.5);
   test.fillRect(100, 100, 50, 50);
   ```
   Should see red rectangle

2. Check NPC sprite positioning:
   ```javascript
   const npc = Array.from(window.npcManager.npcs.values())[0];
   console.log('NPC Sprite:', npc.sprite);
   console.log('Position:', npc.sprite.getCenter());
   ```

3. Verify LOS config in scenario JSON is being loaded:
   ```javascript
   const npc = Array.from(window.npcManager.npcs.values())[0];
   console.log('LOS Config:', npc.los);
   ```
