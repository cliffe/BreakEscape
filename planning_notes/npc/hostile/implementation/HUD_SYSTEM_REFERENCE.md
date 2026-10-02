# HUD System - Complete Reference

## Architecture

```
Browser Window
│
├── <html>
│   ├── <head>
│   │   └── <link rel="stylesheet" href="css/hud.css">  ✅ UNIFIED
│   │
│   └── <body>
│       ├── <div id="game-container">
│       │   └── <canvas>  (Phaser 3D Scene)
│       │
│       ├── <div id="health-ui-container">  (HTML Overlay)
│       │   └── <div class="health-ui-display">
│       │       ├── <img class="health-heart" src="assets/icons/heart.png">
│       │       ├── <img class="health-heart" src="assets/icons/heart.png">
│       │       └── ... (5 total)
│       │
│       └── <div id="inventory-container">  (HTML Overlay)
│           ├── <div class="inventory-slot">
│           │   └── <img class="inventory-item">
│           ├── <div class="inventory-slot">
│           │   └── <img class="inventory-item">
│           └── ... (dynamic slots)
```

## CSS File Structure

### hud.css Organization

```
File: css/hud.css
├── /* HUD (Heads-Up Display) System Styles */
├── /* Combines Inventory and Health UI */
│
├── /* ===== HEALTH UI ===== */
│   ├── #health-ui-container
│   ├── .health-ui-display
│   └── .health-heart
│       └── .health-heart:hover
│
└── /* ===== INVENTORY UI ===== */
    ├── #inventory-container
    │   ├── ::-webkit-scrollbar
    │   ├── ::-webkit-scrollbar-track
    │   └── ::-webkit-scrollbar-thumb
    ├── .inventory-slot
    │   ├── @keyframes pulse-slot
    │   └── .inventory-slot.pulse
    ├── .inventory-item
    │   ├── .inventory-item:hover
    │   └── [data-type="key_ring"]
    └── .inventory-tooltip
        └── .inventory-item:hover + .inventory-tooltip
```

## Display Flow

### When Player Takes Damage

```
1. Combat System
   └── Emit CombatEvents.PLAYER_HP_CHANGED

2. HealthUI Event Listener
   └── updateHP(newHP, maxHP) called

3. HealthUI Logic
   ├── if (hp < maxHP)
   │   └── show() → display: flex
   └── Update heart images based on HP

4. CSS Positioning
   ├── position: fixed
   ├── bottom: 80px  (above inventory)
   ├── left: 50%
   └── transform: translateX(-50%)

5. Browser Rendering
   ├── Health UI renders above inventory
   └── Inventory unaffected
```

### Z-Index Layering

```
Layer 5:
  Minigames
  z-index: 2000
  └── Laptop popup, person-chat, phone-chat

Layer 4:
  Health UI
  z-index: 1100
  └── Hearts display (below minigames, above inventory)

Layer 3:
  Inventory UI
  z-index: 1000
  └── Item slots, badges

Layer 2:
  Game Canvas
  z-index: auto (default)
  └── Phaser scene

Layer 1:
  Background
  z-index: < 100
```

## Position Calculations

### Health UI Position
```
Position: fixed
├── Bottom: 80px
│   └── Inventory height is 80px
│   └── So health appears directly above
├── Left: 50%
│   └── Horizontal center position
├── Transform: translateX(-50%)
│   └── Shift left by half own width to center
└── Z-Index: 1100
    └── Above inventory (1000) but below minigames (2000)
```

### Inventory Position
```
Position: fixed
├── Bottom: 0
│   └── Sits at very bottom of screen
├── Left: 0
├── Right: 0
│   └── Spans full width
├── Height: 80px
│   └── Fixed height for spacing calculations
└── Z-Index: 1000
    └── Below health UI but above game
```

## CSS Properties

### Key Properties for HUD

| Property | Health UI | Inventory | Purpose |
|----------|-----------|-----------|---------|
| position | fixed | fixed | Stay visible when scrolling |
| bottom | 80px | 0 | Health above inventory |
| left | 50% | 0 | Health centered, inventory left |
| z-index | 1100 | 1000 | Health on top |
| display | flex | flex | Layout children |
| image-rendering | pixelated | pixelated | Crisp pixel-art |

## HTML Elements

### Health UI HTML
```html
<div id="health-ui-container">
  <div id="health-ui" class="health-ui-display">
    <img class="health-heart" src="assets/icons/heart.png" alt="HP">
    <img class="health-heart" src="assets/icons/heart.png" alt="HP">
    <img class="health-heart" src="assets/icons/heart-half.png" alt="HP">
    <img class="health-heart" src="assets/icons/heart.png" alt="HP">
    <img class="health-heart" src="assets/icons/heart.png" alt="HP">
  </div>
</div>
```

### Inventory HTML (Dynamic)
```html
<div id="inventory-container">
  <!-- Slots created dynamically by inventory.js -->
  <div class="inventory-slot">
    <img class="inventory-item" data-type="key_ring" data-key-count="3">
    <span class="inventory-tooltip">Key Ring (3 keys)</span>
  </div>
  <div class="inventory-slot">
    <img class="inventory-item" data-type="phone">
    <span class="phone-badge">2</span>
  </div>
  <!-- ... more slots ... -->
</div>
```

## Responsive Design

### Breakpoints
```css
/* All viewport sizes */
#health-ui-container {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);  /* Always centered */
}

/* Mobile/Tablet/Desktop */
All sizes use same positioning
└── Scales with page zoom only
```

## Performance

### Rendering Optimization
```css
.health-heart {
  image-rendering: pixelated;        /* GPU-accelerated */
  transition: opacity 0.2s;           /* Smooth transitions */
  display: block;                     /* Block layout */
}

#health-ui-container {
  pointer-events: none;               /* Don't intercept clicks */
  z-index: 1100;                      /* GPU-accelerated compositing */
}
```

### What Triggers Reflow
- Player takes damage (updateHP called)
- Heart opacity changes (CSS transition)
- New item added (inventory slot animation)

### What's GPU-Accelerated
- Z-index compositing
- Transform: translateX()
- Opacity transitions
- Image-rendering pixelated

## Integration Points

### From health-ui.js
```javascript
// Creates and appends container
document.body.appendChild(this.container);

// Updates heart images
heart.src = 'assets/icons/heart.png';

// Shows/hides container
this.container.style.display = 'flex' | 'none';
```

### From inventory.js
```javascript
// Gets existing container
const inventoryContainer = document.getElementById('inventory-container');

// Appends inventory slots
inventoryContainer.appendChild(slot);

// Updates with dynamic content
container.innerHTML = '';  // Clear and rebuild
```

## Stylesheet References

### hud.css Sections
1. **Health UI** (lines 1-36)
   - `#health-ui-container` positioning
   - `.health-ui-display` styling
   - `.health-heart` images

2. **Inventory UI** (lines 38-186)
   - `#inventory-container` layout
   - `.inventory-slot` styling
   - `.inventory-item` animations
   - `.phone-badge` styling
   - Key ring badge styling

## Testing Checklist

- [ ] Load index.html
- [ ] Open DevTools (F12)
- [ ] Take damage to trigger health UI
- [ ] Verify health shows above inventory
- [ ] Verify proper spacing (no overlap)
- [ ] Verify z-index stacking (health above inventory)
- [ ] Verify responsiveness at different zooms
- [ ] Check console for no errors

## Documentation Files

- `docs/HUD_QUICK_SUMMARY.md` - Quick overview
- `docs/HUD_REFACTORING.md` - Detailed changes
- `docs/HUD_SYSTEM_REFERENCE.md` - This file

## Files Changed

✅ Created: `css/hud.css`
✅ Updated: `index.html`
✅ Updated: `test-los-visualization.html`
✅ Updated: `test-npc-interaction.html`

## Files Superseded

📁 `css/inventory.css` (now in hud.css)
📁 `css/health-ui.css` (now in hud.css)

Can be deleted once confirmed working.
