# RFID Keycard System - Asset Requirements

## Overview

This document specifies all visual and audio assets needed for the RFID keycard lock system. Each asset is categorized by priority, with specifications and placeholder suggestions.

---

## Object Sprites

### 1. Generic Keycard
**File**: `/assets/objects/keycard.png`
**Priority**: P0 (Blocker)
**Dimensions**: 32x48 pixels
**Format**: PNG with transparency

**Specifications**:
- Rectangular card shape
- Neutral color (gray/white)
- Small RFID chip graphic (metallic gold square)
- Simple, clean design
- Visible from inventory

**Placeholder Strategy**:
```bash
# Copy and modify existing key sprite
cp assets/objects/key.png assets/objects/keycard.png
```
Then edit to add rectangular shape and chip graphic.

**Reference**: Hotel room key card, employee badge

---

### 2. CEO Keycard
**File**: `/assets/objects/keycard-ceo.png`
**Priority**: P1 (High)
**Dimensions**: 32x48 pixels
**Format**: PNG with transparency

**Specifications**:
- Based on generic keycard
- Gold/yellow tint (#FFD700)
- Optional: "EXEC" or "VIP" text
- More prestigious appearance

**Placeholder Strategy**:
```bash
# Copy generic card and apply gold filter
cp assets/objects/keycard.png assets/objects/keycard-ceo.png
```

**Reference**: Executive access badge, gold credit card

---

### 3. Security Keycard
**File**: `/assets/objects/keycard-security.png`
**Priority**: P1 (High)
**Dimensions**: 32x48 pixels
**Format**: PNG with transparency

**Specifications**:
- Based on generic keycard
- Blue tint (#4169E1)
- Optional: "SEC" text or badge icon
- Professional/authoritative look

**Placeholder Strategy**:
```bash
cp assets/objects/keycard.png assets/objects/keycard-security.png
```

---

### 4. Maintenance Keycard
**File**: `/assets/objects/keycard-maintenance.png`
**Priority**: P2 (Medium)
**Dimensions**: 32x48 pixels
**Format**: PNG with transparency

**Specifications**:
- Based on generic keycard
- Green tint (#32CD32)
- Optional: wrench or tool icon
- Utilitarian appearance

---

### 5. RFID Cloner Device
**File**: `/assets/objects/rfid_cloner.png`
**Priority**: P0 (Blocker)
**Dimensions**: 48x48 pixels
**Format**: PNG with transparency

**Specifications**:
- Inspired by Flipper Zero device
- Orange accent color (#FF8200)
- Small screen indication (black rectangle)
- Device shape: rectangular with rounded corners
- Visible antenna or signal waves

**Placeholder Strategy**:
```bash
# Copy bluetooth scanner and modify
cp assets/objects/bluetooth_scanner.png assets/objects/rfid_cloner.png
```
Then edit to:
- Add orange accent
- Add small screen
- Modify to look like Flipper Zero

**Reference Images**:
- Flipper Zero device
- RFID/NFC readers
- Handheld scanners

**Color Palette**:
- Main body: #2B2B2B (dark gray)
- Accent: #FF8200 (orange)
- Screen: #000000 (black)
- Highlights: #FFFFFF (white)

---

## Icon Assets

### 6. RFID Lock Icon
**File**: `/assets/icons/rfid-icon.png`
**Priority**: P1 (High)
**Dimensions**: 24x24 pixels
**Format**: PNG with transparency

**Specifications**:
- Simple RFID wave symbol
- Three curved lines radiating from a point
- Monochrome (white or orange)
- Clear at small size

**Usage**: Display on locked doors, UI indicators

---

### 7. NFC Waves Icon
**File**: `/assets/icons/nfc-waves.png`
**Priority**: P2 (Medium)
**Dimensions**: 32x32 pixels
**Format**: PNG with transparency

**Specifications**:
- Animated wave effect (can be CSS animated)
- Concentric circles or radio waves
- Orange color (#FF8200)
- Used during card tap/emulation

---

### 8. Keycard Icon (Inventory)
**File**: `/assets/icons/keycard-icon.png`
**Priority**: P2 (Medium)
**Dimensions**: 24x24 pixels
**Format**: PNG with transparency

**Specifications**:
- Simplified keycard representation
- Single color or two-tone
- Recognizable at icon size

---

## Minigame UI Assets

### 9. Flipper Zero Frame (Optional)
**File**: `/assets/minigames/flipper-frame.png`
**Priority**: P3 (Low)
**Dimensions**: 400x500 pixels
**Format**: PNG with transparency

**Specifications**:
- Full device frame image
- Orange casing (#FF8200)
- Screen cutout (transparent or black)
- Button indications
- High quality for UI display

**Note**: This can be replaced with CSS styling for simplicity.

---

### 10. Flipper Zero Buttons (Optional)
**File**: `/assets/minigames/flipper-buttons.png`
**Priority**: P3 (Low)
**Dimensions**: Varies
**Format**: PNG sprite sheet

**Specifications**:
- Individual button images
- Directional pad
- Action buttons
- Orange and white colors

---

## Sound Effects (Optional)

### 11. Card Tap Sound
**File**: `/assets/sounds/rfid_tap.mp3`
**Priority**: P3 (Low)
**Duration**: 0.2-0.5 seconds
**Format**: MP3, 128kbps

**Specifications**:
- Short, crisp "tap" or "beep"
- Not too loud
- Pleasant tone

**Reference**: Credit card tap payment sound

---

### 12. Card Reading Sound
**File**: `/assets/sounds/rfid_read.mp3`
**Priority**: P3 (Low)
**Duration**: 2-3 seconds
**Format**: MP3, 128kbps

**Specifications**:
- Scanning/reading sound
- Electronic beeps or hum
- Progressive pitch (low to high)
- Matches reading animation duration

---

### 13. Success Sound
**File**: `/assets/sounds/rfid_success.mp3`
**Priority**: P3 (Low)
**Duration**: 0.5-1 second
**Format**: MP3, 128kbps

**Specifications**:
- Positive, affirming tone
- Short chime or "success" beep
- Not too loud or jarring

---

### 14. Failure Sound
**File**: `/assets/sounds/rfid_failure.mp3`
**Priority**: P3 (Low)
**Duration**: 0.5-1 second
**Format**: MP3, 128kbps

**Specifications**:
- Negative, denying tone
- Short buzz or "error" beep
- Distinct from success

---

### 15. Emulation Hum
**File**: `/assets/sounds/rfid_emulate.mp3`
**Priority**: P3 (Low)
**Duration**: 2-3 seconds (loopable)
**Format**: MP3, 128kbps

**Specifications**:
- Continuous electronic hum
- Can loop seamlessly
- Subtle background sound

---

## Placeholder Creation Scripts

### Script 1: Create Keycard Placeholders
```bash
#!/bin/bash
# create_keycard_placeholders.sh

# Create placeholder directory
mkdir -p planning_notes/rfid_keycard/placeholders

# Copy key sprite as base
cp assets/objects/key.png planning_notes/rfid_keycard/placeholders/keycard-base.png

# Copy for variants (manual editing needed)
cp planning_notes/rfid_keycard/placeholders/keycard-base.png assets/objects/keycard.png
cp assets/objects/keycard.png assets/objects/keycard-ceo.png
cp assets/objects/keycard.png assets/objects/keycard-security.png
cp assets/objects/keycard.png assets/objects/keycard-maintenance.png

echo "Placeholder keycards created - manual editing required"
echo "Edit with image editor to:"
echo "  1. Make rectangular card shape"
echo "  2. Add RFID chip graphic"
echo "  3. Apply color tints for variants"
```

---

### Script 2: Create RFID Cloner Placeholder
```bash
#!/bin/bash
# create_cloner_placeholder.sh

# Copy bluetooth scanner as base
cp assets/objects/bluetooth_scanner.png assets/objects/rfid_cloner.png

echo "Placeholder RFID cloner created - manual editing required"
echo "Edit with image editor to:"
echo "  1. Add orange accent (#FF8200)"
echo "  2. Add small screen (black rectangle)"
echo "  3. Modify to look like Flipper Zero"
```

---

### Script 3: Create Icon Placeholders
```bash
#!/bin/bash
# create_icon_placeholders.sh

# Create simple RFID wave icon (requires ImageMagick)
convert -size 24x24 xc:transparent \
  -fill white -stroke white -strokewidth 1 \
  -draw "path 'M 8,12 Q 12,8 16,12'" \
  -draw "path 'M 6,12 Q 12,4 18,12'" \
  -draw "path 'M 4,12 Q 12,2 20,12'" \
  assets/icons/rfid-icon.png

echo "RFID icon created"

# Create NFC waves icon
convert -size 32x32 xc:transparent \
  -fill none -stroke orange -strokewidth 2 \
  -draw "circle 16,16 16,8" \
  -draw "circle 16,16 16,12" \
  assets/icons/nfc-waves.png

echo "NFC waves icon created"
```

---

## Asset Specifications Summary Table

| Asset | File | Size (px) | Priority | Status |
|-------|------|-----------|----------|--------|
| Generic Keycard | `keycard.png` | 32x48 | P0 | Placeholder needed |
| CEO Keycard | `keycard-ceo.png` | 32x48 | P1 | Variant of generic |
| Security Keycard | `keycard-security.png` | 32x48 | P1 | Variant of generic |
| Maintenance Card | `keycard-maintenance.png` | 32x48 | P2 | Variant of generic |
| RFID Cloner | `rfid_cloner.png` | 48x48 | P0 | Placeholder needed |
| RFID Icon | `rfid-icon.png` | 24x24 | P1 | Can be simple |
| NFC Waves | `nfc-waves.png` | 32x32 | P2 | Can be simple |
| Keycard Icon | `keycard-icon.png` | 24x24 | P2 | Optional |
| Flipper Frame | `flipper-frame.png` | 400x500 | P3 | Optional (CSS alt) |
| Flipper Buttons | `flipper-buttons.png` | Varies | P3 | Optional |

---

## Color Palette Reference

### Flipper Zero Official Colors
- **Primary Orange**: #FF8200
- **Dark Orange**: #CC6700
- **Screen Background**: #000000
- **Screen Text**: #FF8200
- **Device Body**: #2B2B2B
- **Button Color**: #FFFFFF

### Keycard Variants
- **Generic**: #CCCCCC (gray)
- **CEO**: #FFD700 (gold)
- **Security**: #4169E1 (blue)
- **Maintenance**: #32CD32 (green)

### UI Elements
- **Success**: #00FF00 (green)
- **Failure**: #FF0000 (red)
- **Warning**: #FFA500 (orange)
- **Info**: #00BFFF (light blue)

---

## Image Editing Guidelines

### Tools
- **Recommended**: GIMP (free, cross-platform)
- **Alternative**: Photoshop, Paint.NET, Aseprite
- **Online**: Photopea (photopea.com)

### Process for Creating Keycards

1. **Start with base sprite**
   - Open `assets/objects/key.png`
   - Resize canvas to 32x48px

2. **Create card shape**
   - Use rectangle tool
   - Rounded corners (2-3px radius)
   - Fill with base color (#CCCCCC)

3. **Add RFID chip**
   - Create small square (8x8px)
   - Position in upper-right
   - Color: #FFD700 (gold)
   - Add shine/highlight

4. **Add details**
   - Optional text (CEO, SEC, etc.)
   - Optional stripe or pattern
   - Optional company logo

5. **Create variants**
   - Duplicate base card
   - Apply color adjustment layer
   - Hue shift for each variant

6. **Export**
   - Format: PNG-24
   - Transparency: Yes
   - Optimize: Yes

---

### Process for Creating RFID Cloner

1. **Start with scanner sprite**
   - Open `assets/objects/bluetooth_scanner.png`
   - Resize to 48x48px if needed

2. **Modify device shape**
   - More rectangular
   - Rounded corners
   - Thicker body

3. **Add screen**
   - Black rectangle in upper portion
   - 60% of width, 40% of height
   - Position centered horizontally
   - Small margin from top

4. **Add orange accents**
   - Border around screen: #FF8200
   - Side stripe or logo
   - Button indicators

5. **Add details**
   - Small antenna line
   - Button outlines
   - Optional Flipper logo

6. **Export**
   - Same as keycard process

---

## Asset Testing Checklist

- [ ] All sprites are correct dimensions
- [ ] Transparent backgrounds work correctly
- [ ] Sprites are visible against game backgrounds
- [ ] Icons are recognizable at small sizes
- [ ] Color variants are distinguishable
- [ ] Sprites align correctly in inventory
- [ ] No pixelation or artifacts
- [ ] Files are optimized (< 50KB each)
- [ ] Sound files are correct format
- [ ] Sound files are not too loud
- [ ] All assets load without errors

---

## Future Asset Enhancements

### Advanced Keycards
- Animated holographic effect
- Photo ID badges
- Different card shapes (circular, hexagonal)
- Company logos and branding

### Advanced Cloner
- Animated screen display
- Button press feedback
- Battery level indicator
- Signal strength visualization

### Advanced Effects
- Card swipe animation
- Emulation wave particles
- Success/failure screen effects
- Holographic data streams

---

## Asset Attribution

If using external assets, ensure proper attribution:

**Flipper Zero**:
- Official colors and design are trademarked
- Use inspired design, not exact replica
- Reference: https://flipperzero.one/

**RFID/NFC Icons**:
- Generic wave symbols are not copyrighted
- Can use standard radio wave representation

---

## Licensing

All created assets should be:
- Compatible with project license
- Original creations or properly licensed
- Documented in asset credits file

---

**Last Updated**: 2024-01-15
**Status**: Specifications Complete
**Next Steps**: Create placeholder assets, then refine
