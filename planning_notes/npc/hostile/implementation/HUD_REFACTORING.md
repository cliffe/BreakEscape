# HUD System Refactoring

## What Changed

### Consolidated CSS Files

**Before:**
- `css/inventory.css` - Inventory styling only
- `css/health-ui.css` - Health UI styling

**After:**
- `css/hud.css` - Combined inventory AND health UI (unified HUD system)

### Files Updated

1. **Created:** `css/hud.css` - Consolidated HUD styling
2. **Updated:** `index.html` - Changed from `inventory.css` + `health-ui.css` to `hud.css`
3. **Updated:** `test-los-visualization.html` - Changed to `hud.css`
4. **Updated:** `test-npc-interaction.html` - Changed to `hud.css`

### Positioning Changed

**Health UI Position:**
- **Before:** `top: 60px` (top center of screen)
- **After:** `bottom: 80px` (directly above inventory)

## New HUD Layout

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              [Game World / Canvas]                   │
│                                                      │
│  Player, NPCs, Map, Interactions, etc.              │
│                                                      │
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│           ❤️  ❤️  ❤️  ❤️  💔                         │
│          (Health UI - z-index: 1100)               │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ [Item] [Item] [Item] [Phone] [Notepad]      │  │
│  │ Inventory UI - z-index: 1000                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## CSS Structure

### hud.css Layout

```css
/* ===== HEALTH UI ===== */
#health-ui-container {
  bottom: 80px;  /* Key position: directly above inventory */
  z-index: 1100;  /* Above inventory */
}

/* ===== INVENTORY UI ===== */
#inventory-container {
  bottom: 0;      /* At bottom */
  z-index: 1000;  /* Below health UI */
}
```

## Z-Index Stack

```
2000  ┌─────────────────────────────┐
      │  Minigames (laptop, etc.)   │
      │  z-index: 2000              │
      │                             │
1100  ├─────────────────────────────┤
      │  Health UI                  │
      │  z-index: 1100              │
      │  bottom: 80px               │
      │  (Directly above inventory) │
      │                             │
1000  ├─────────────────────────────┤
      │  Inventory UI               │
      │  z-index: 1000              │
      │  bottom: 0                  │
      │  (Bottom of screen)         │
      │                             │
 100  ├─────────────────────────────┤
      │  Other UI elements          │
      │  z-index: < 1000            │
      │                             │
  0   └─────────────────────────────┘
```

## CSS Reference

### Health UI
```css
#health-ui-container {
  position: fixed;
  bottom: 80px;              /* Above 80px inventory */
  left: 50%;
  transform: translateX(-50%); /* Center horizontally */
  z-index: 1100;
  pointer-events: none;
}

.health-ui-display {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #333;
}

.health-heart {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}
```

### Inventory UI
```css
#inventory-container {
  position: fixed;
  bottom: 0;          /* At bottom */
  left: 0;
  right: 0;
  height: 80px;       /* Fixed height */
  z-index: 1000;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-family: 'VT323';
}

.inventory-slot {
  min-width: 60px;
  height: 60px;
  margin: 0 5px;
}
```

## Visual Alignment

```
Screen Width (100%)
┌────────────────────────────────────────────────────┐
│                                                    │
│  Game Area (Phaser Canvas)                         │
│  image-rendering: pixelated                        │
│                                                    │
│                                                    │
│              ❤️  ❤️  ❤️  ❤️  💔                   │
│           (Centered horizontally, bottom: 80px)   │
│                                                    │
│  [I] [I] [I] [Ph] [Notes]                         │
│  (Full width bottom, bottom: 0)                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Metrics

| Element | Bottom | Width | Height | Z-Index |
|---------|--------|-------|--------|---------|
| Health UI | 80px | auto (centered) | auto | 1100 |
| Inventory | 0px | 100% | 80px | 1000 |
| Gap | 0px | N/A | 80px | N/A |

## Benefits

✅ **Unified HUD System** - All UI in one CSS file
✅ **Better Organization** - Clear separation between Health and Inventory sections
✅ **Proper Positioning** - Health directly above inventory (no gaps)
✅ **Maintained Z-Index** - Both systems have proper layering
✅ **Easy to Maintain** - Single source of truth for HUD styling
✅ **Consistent Pixel-Art Aesthetic** - Both use pixelated rendering

## File References

- **hud.css** - Master HUD stylesheet (inventory + health)
- **health-ui.js** - Health UI logic (unchanged)
- **inventory.js** - Inventory logic (unchanged)
- **index.html** - Loads single hud.css file

## Backward Compatibility

The old `inventory.css` and `health-ui.css` files still exist in the repository but are no longer used. They can be deleted once this refactoring is confirmed to be working.

## Testing

1. **Load game** - Open index.html
2. **Check HUD layout** - Health above inventory at bottom
3. **Take damage** - Health UI should show directly above inventory
4. **Check spacing** - No gap between health and inventory
5. **Verify styling** - Pixel-art aesthetic maintained

## Migration Checklist

- [x] Created css/hud.css with both systems
- [x] Updated index.html to use hud.css
- [x] Updated test-los-visualization.html to use hud.css
- [x] Updated test-npc-interaction.html to use hud.css
- [ ] Delete css/inventory.css (old file, no longer used)
- [ ] Delete css/health-ui.css (old file, no longer used)
- [ ] Test in browser (player takes damage)
- [ ] Verify health shows above inventory
