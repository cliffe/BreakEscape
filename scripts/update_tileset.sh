#!/bin/bash

# Script to update Tiled map with all objects from assets directory
# This ensures all objects are included in the tileset with proper GIDs

echo "🔧 Updating Tileset with All Objects"
echo "===================================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 to run this script."
    exit 1
fi

# Run the update script
python3 scripts/update_tileset.py

echo ""
echo "📝 Next Steps:"
echo "1. Open the map in Tiled Editor"
echo "2. Check that all objects are available in the tileset"
echo "3. Place any missing objects in your layers"
echo "4. Save the map"
echo ""
echo "🎯 This script ensures all objects from assets/objects/ are included in the tileset!"
