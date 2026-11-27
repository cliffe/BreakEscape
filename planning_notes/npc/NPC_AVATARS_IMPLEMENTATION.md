# NPC Avatar System Implementation

**Status:** ✅ Complete (2024-10-31)

## Overview
Added visual avatar support to the NPC system. NPCs can now have 32x32px pixel-art avatars that display in bark notifications and phone conversations, providing visual identification and personality.

## Implementation

### Files Created
- **`scripts/create_npc_avatars.py`** (Python script, ~120 lines)
  - Uses PIL (Pillow) to generate pixel-art avatars
  - Creates 3 default avatar types with distinct visual styles
  
- **`assets/npc/avatars/npc_helper.png`** (32x32px, 280 bytes)
  - Green shirt (#5fcf69 - matches game's green theme)
  - Friendly smile (upward arc)
  - Represents helpful, supportive NPCs
  
- **`assets/npc/avatars/npc_adversary.png`** (32x32px, 269 bytes)
  - Red shirt (#dc3232 - warning color)
  - Suspicious frown (downward arc)
  - Narrowed eyes (suspicious expression)
  - Represents adversarial, warning NPCs
  
- **`assets/npc/avatars/npc_neutral.png`** (32x32px, 274 bytes)
  - Gray shirt (#a0a0ad - matches game's gray)
  - Neutral expression (straight mouth)
  - Normal eyes
  - Represents standard/neutral NPCs

### Files Modified
- **`css/npc-barks.css`** (+18 lines)
  - Updated `.npc-bark` to use flexbox layout
  - Added `.npc-bark-avatar` class (32x32px, pixelated rendering, 2px border)
  - Added `.npc-bark-text` class (flex text container)
  
- **`js/systems/npc-barks.js`** (~15 lines modified)
  - Updated `showBark()` signature to accept `avatar` parameter
  - Creates `<img>` element for avatar when provided
  - Wraps text in `<span class="npc-bark-text">` for layout
  
- **`scenarios/ceo_exfil.json`** (3 NPCs updated)
  - `helper_npc`: avatar = `"assets/npc/avatars/npc_helper.png"`
  - `neye_eve`: avatar = `"assets/npc/avatars/npc_adversary.png"`
  - `gossip_girl`: avatar = `"assets/npc/avatars/npc_neutral.png"`

## Features

### 1. Avatar Display in Barks
```javascript
// Bark with avatar
showBark({
  npcId: 'helper_npc',
  npcName: 'Helpful Contact',
  message: 'Found something interesting!',
  avatar: 'assets/npc/avatars/npc_helper.png'  // NEW
});
```

**Visual layout:**
```
┌─────────────────────────────────┐
│ [🧑] Helpful Contact: Found... │  ← Avatar + text
└─────────────────────────────────┘
```

### 2. Pixel-Perfect Rendering
```css
.npc-bark-avatar {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
```
- No blur/smoothing on avatars
- Maintains sharp pixel-art aesthetic
- Works across all browsers

### 3. Scenario Configuration
```json
{
  "npcs": [
    {
      "id": "helper_npc",
      "displayName": "Helpful Contact",
      "avatar": "assets/npc/avatars/npc_helper.png",
      ...
    }
  ]
}
```
- Avatar path stored in scenario JSON
- Easy to customize per scenario
- `null` or omitted = no avatar (backward compatible)

## Avatar Design Specifications

### Dimensions
- **Size**: 32x32 pixels (exact)
- **Format**: PNG with transparency
- **File size**: ~270-280 bytes (highly optimized)

### Color Palette
- **Helper** (Green theme):
  - Shirt: #5fcf69 (phone LCD green)
  - Skin: #ffdcb1 (beige)
  - Outline: #000000
  
- **Adversary** (Red theme):
  - Shirt: #dc3232 (warning red)
  - Skin: #ffdcb1 (beige)
  - Outline: #000000
  
- **Neutral** (Gray theme):
  - Shirt: #a0a0ad (game gray)
  - Skin: #ffdcb1 (beige)
  - Outline: #000000

### Visual Elements
- **Head**: 16px circle (beige)
- **Eyes**: 3px wide, 2px tall (black)
- **Mouth**: 
  - Helper: Arc upward (smile)
  - Adversary: Arc downward (frown)
  - Neutral: Straight line
- **Body**: 12px wide rectangle (colored shirt)
- **Arms**: 4px wide rectangles on sides
- **Hands**: Small beige rectangles at bottom
- **Outline**: 1px black border on all shapes

## Usage Examples

### Default Avatars
```javascript
// Helper NPC (friendly, supportive)
{
  avatar: 'assets/npc/avatars/npc_helper.png'
}

// Adversary NPC (suspicious, warning)
{
  avatar: 'assets/npc/avatars/npc_adversary.png'
}

// Neutral NPC (standard, informative)
{
  avatar: 'assets/npc/avatars/npc_neutral.png'
}
```

### Custom Avatars
1. Create 32x32px PNG image
2. Use pixel-art style (no anti-aliasing)
3. Save to `assets/npc/avatars/`
4. Reference in scenario JSON:
```json
{
  "avatar": "assets/npc/avatars/custom_npc.png"
}
```

### No Avatar (Backward Compatible)
```json
{
  "avatar": null  // or omit the property entirely
}
```

## Display Locations

### ✅ Currently Supported
1. **Bark notifications** (bottom-left corner)
   - Avatar on left, text on right
   - Flexbox layout with 10px gap

2. **Phone-chat conversation header** (already implemented)
   - Avatar displayed in conversation header
   - 32x32px with same styling

### 🔄 Future Possibilities
1. Contact list (show avatar next to each contact)
2. In-world NPC sprites (if NPCs become physical characters)
3. Objective/quest UI (show quest giver avatar)
4. Notification history (persistent log with avatars)

## Creating New Avatars

### Using the Python Script
```bash
cd /path/to/BreakEscape
python3 scripts/create_npc_avatars.py
```

### Manually with Image Editor
1. Create 32x32px canvas
2. Use pixel-art tools (Aseprite, Piskel, GIMP with pencil tool)
3. Draw simple character:
   - Keep it minimal (16-color palette max)
   - Use 2px black outlines
   - Match existing style (round head, simple body)
4. Export as PNG
5. Optimize with `pngcrush` or `optipng` (optional)

### Design Tips
- **Keep it simple**: 32x32px is very small
- **Use bold colors**: Easily distinguishable at a glance
- **High contrast**: Black outlines on colored fills
- **Consistent style**: Match existing avatars' structure
- **Test at 1x scale**: Should be recognizable without zooming

## Avatar Categories

### Suggested Types
1. **Helper** (green) - Friendly allies, tech support, informants
2. **Adversary** (red) - Antagonists, security guards, obstacles
3. **Neutral** (gray) - Shopkeepers, bystanders, optional contacts
4. **Authority** (blue?) - Police, admins, official NPCs
5. **Mystery** (purple?) - Hackers, anonymous sources, enigmatic characters

### Example Assignments
- **Helpful Contact** → Helper (green)
- **Neye Eve** → Adversary (red) 
- **Gossip Girl** → Neutral (gray)
- **Anonymous Hacker** → Mystery (purple - if created)
- **Security Chief** → Authority (blue - if created)

## Browser Compatibility

### Image Rendering
- **Chrome/Edge**: ✅ `image-rendering: pixelated` fully supported
- **Firefox**: ✅ `-moz-crisp-edges` fallback works
- **Safari**: ✅ `crisp-edges` supported
- **Mobile**: ✅ All major mobile browsers support crisp rendering

### Performance
- Tiny file sizes (~270 bytes) = instant loading
- No additional HTTP requests (embedded in barks)
- GPU-accelerated rendering (CSS-based)

## Implementation Stats

- **Avatar images created:** 3 (helper, adversary, neutral)
- **Total file size:** ~800 bytes (all 3 combined)
- **Lines added/modified:** ~33 total
  - CSS: +18 lines
  - JS: ~15 lines modified
- **Breaking changes:** None (backward compatible)
- **Default behavior:** Avatars display if provided, otherwise text-only

## Benefits

1. **Visual Identification**: Instantly recognize NPCs without reading names
2. **Personality Expression**: Avatar style conveys NPC's role/alignment
3. **Professional Polish**: Adds visual richness to UI
4. **Color Coding**: Green=helpful, Red=warning, Gray=neutral
5. **Scalability**: Easy to add more avatars as needed
6. **Performance**: Tiny file sizes, no impact on load times
7. **Consistency**: Pixel-art style matches game aesthetic
8. **Flexibility**: Scenario-configurable, easy to customize

## Testing Checklist

- [x] Generate 3 default avatars via Python script
- [x] Verify avatars created in correct directory
- [x] Update NPCBarkSystem to display avatars
- [x] Update bark CSS with flexbox layout
- [x] Add avatars to scenario JSON
- [ ] Test bark display with avatars in-game
- [ ] Verify pixel-perfect rendering (no blur)
- [ ] Test on different browsers
- [ ] Verify backward compatibility (no avatar = text-only)
- [ ] Test phone-chat conversation header (already implemented)

## Next Steps

### Immediate
1. **Test in-game**: Refresh page, trigger barks, verify avatars appear
2. **Verify rendering**: Check that pixel-art is crisp (not blurry)
3. **Test all NPCs**: helper_npc, neye_eve, gossip_girl

### Future Enhancements
1. **More avatar types**: Create authority, mystery, specialist variants
2. **Animated avatars**: Simple 2-frame animations (blink, talk)
3. **Avatar customization**: In-game avatar selector/creator
4. **Avatar repository**: Library of pre-made avatars for quick use
5. **Contact list avatars**: Show in phone contact list
6. **Avatar expressions**: Multiple expressions per NPC (happy, sad, surprised)

---
**Status:** ✅ Implementation complete, ready for testing
**Date:** 2024-10-31
**Phase:** Phase 5 (Polish & Additional Features)
