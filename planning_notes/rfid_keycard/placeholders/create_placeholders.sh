#!/bin/bash

# RFID Keycard System - Placeholder Asset Creation Script
# This script creates placeholder assets by copying existing sprites

echo "🎨 Creating RFID Keycard System Placeholder Assets..."
echo ""

# Define paths
ASSETS_DIR="assets/objects"
ICONS_DIR="assets/icons"
PLACEHOLDER_DIR="planning_notes/rfid_keycard/placeholders"

# Create placeholder directory if it doesn't exist
mkdir -p "$PLACEHOLDER_DIR"

echo "📋 Step 1: Creating keycard placeholders..."
# Copy key sprite as base for keycard
if [ -f "$ASSETS_DIR/key.png" ]; then
    cp "$ASSETS_DIR/key.png" "$ASSETS_DIR/keycard.png"
    echo "  ✓ Created keycard.png (copied from key.png)"

    # Create variants
    cp "$ASSETS_DIR/keycard.png" "$ASSETS_DIR/keycard-ceo.png"
    echo "  ✓ Created keycard-ceo.png"

    cp "$ASSETS_DIR/keycard.png" "$ASSETS_DIR/keycard-security.png"
    echo "  ✓ Created keycard-security.png"

    cp "$ASSETS_DIR/keycard.png" "$ASSETS_DIR/keycard-maintenance.png"
    echo "  ✓ Created keycard-maintenance.png"
else
    echo "  ⚠️  Warning: key.png not found, skipping keycard creation"
fi

echo ""
echo "📱 Step 2: Creating RFID cloner placeholder..."
# Copy bluetooth scanner as base for RFID cloner
if [ -f "$ASSETS_DIR/bluetooth_scanner.png" ]; then
    cp "$ASSETS_DIR/bluetooth_scanner.png" "$ASSETS_DIR/rfid_cloner.png"
    echo "  ✓ Created rfid_cloner.png (copied from bluetooth_scanner.png)"
else
    echo "  ⚠️  Warning: bluetooth_scanner.png not found, trying phone.png..."
    if [ -f "$ASSETS_DIR/phone.png" ]; then
        cp "$ASSETS_DIR/phone.png" "$ASSETS_DIR/rfid_cloner.png"
        echo "  ✓ Created rfid_cloner.png (copied from phone.png)"
    else
        echo "  ⚠️  Warning: No suitable sprite found for rfid_cloner.png"
    fi
fi

echo ""
echo "🔐 Step 3: Creating icon placeholders..."
# Create simple placeholder icons
if [ -f "$ICONS_DIR/signal.png" ]; then
    cp "$ICONS_DIR/signal.png" "$ICONS_DIR/rfid-icon.png"
    echo "  ✓ Created rfid-icon.png (copied from signal.png)"
else
    echo "  ⚠️  Warning: signal.png not found, skipping rfid-icon.png"
fi

if [ -f "$ICONS_DIR/signal.png" ]; then
    cp "$ICONS_DIR/signal.png" "$ICONS_DIR/nfc-waves.png"
    echo "  ✓ Created nfc-waves.png (copied from signal.png)"
else
    echo "  ⚠️  Warning: signal.png not found, skipping nfc-waves.png"
fi

echo ""
echo "📝 Step 4: Creating documentation..."
# Create a file documenting what needs to be edited
cat > "$PLACEHOLDER_DIR/EDITING_INSTRUCTIONS.txt" << 'EOF'
RFID Keycard System - Placeholder Asset Editing Instructions
=============================================================

The placeholder assets have been created by copying existing sprites.
They now need to be edited to match the specifications.

KEYCARDS (assets/objects/keycard*.png)
---------------------------------------
Current: Copy of key.png
Needs:
  1. Rectangular card shape (32x48px)
  2. Rounded corners (2-3px radius)
  3. Small RFID chip graphic (8x8px gold square in upper-right)
  4. Color variants:
     - keycard.png: Gray/white (#CCCCCC)
     - keycard-ceo.png: Gold (#FFD700)
     - keycard-security.png: Blue (#4169E1)
     - keycard-maintenance.png: Green (#32CD32)

Tools: GIMP, Photoshop, Paint.NET, or Photopea (online)

RFID CLONER (assets/objects/rfid_cloner.png)
---------------------------------------------
Current: Copy of bluetooth_scanner.png or phone.png
Needs:
  1. More rectangular device shape (48x48px)
  2. Orange accent color (#FF8200)
  3. Small black screen in upper portion
  4. Flipper Zero-inspired design
  5. Optional: Small antenna or wave indication

Reference: Google "Flipper Zero" for design inspiration

ICONS (assets/icons/)
--------------------
Current: Copy of signal.png
Needs:
  rfid-icon.png (24x24px):
    - Simple RFID wave symbol (3 curved lines)
    - Monochrome white or orange

  nfc-waves.png (32x32px):
    - Concentric circles or radio waves
    - Orange color (#FF8200)

These can be very simple - clarity at small size is key.

OPTIONAL: Create final professional assets
-------------------------------------------
The placeholders will work for development and testing.
For final release, consider:
  - Hiring a pixel artist
  - Using asset creation tools (Aseprite, Pyxel Edit)
  - Commissioning custom sprites

COLOR PALETTE REFERENCE
-----------------------
Flipper Zero Orange: #FF8200
CEO Gold: #FFD700
Security Blue: #4169E1
Maintenance Green: #32CD32
Generic Gray: #CCCCCC
Device Dark Gray: #2B2B2B
Screen Black: #000000
EOF

echo "  ✓ Created EDITING_INSTRUCTIONS.txt"

echo ""
echo "✅ Placeholder creation complete!"
echo ""
echo "📂 Created files:"
echo "   - assets/objects/keycard.png"
echo "   - assets/objects/keycard-ceo.png"
echo "   - assets/objects/keycard-security.png"
echo "   - assets/objects/keycard-maintenance.png"
echo "   - assets/objects/rfid_cloner.png"
echo "   - assets/icons/rfid-icon.png (if signal.png exists)"
echo "   - assets/icons/nfc-waves.png (if signal.png exists)"
echo ""
echo "📝 Next steps:"
echo "   1. Read planning_notes/rfid_keycard/placeholders/EDITING_INSTRUCTIONS.txt"
echo "   2. Edit placeholder sprites to match specifications"
echo "   3. See planning_notes/rfid_keycard/03_ASSETS_REQUIREMENTS.md for details"
echo ""
echo "🎨 Placeholders are functional for development!"
echo "   You can start coding immediately and refine assets later."
