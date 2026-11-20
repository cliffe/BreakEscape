#!/usr/bin/env python3

import json
import os
import shutil
from datetime import datetime

"""
Script to remove external tileset references from Tiled map
This will remove tilesets that reference external .tsx files, keeping only embedded tilesets
"""

MAP_FILE = "assets/rooms/room_reception2.json"
BACKUP_FILE = f"assets/rooms/room_reception2.json.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

def main():
    """Main function to remove external tileset references"""
    print("🧹 Removing External Tileset References")
    print("=" * 50)
    
    if not os.path.exists(MAP_FILE):
        print(f"❌ Map file not found: {MAP_FILE}")
        return
    
    # Create backup
    print(f"📁 Creating backup: {BACKUP_FILE}")
    shutil.copy2(MAP_FILE, BACKUP_FILE)
    
    try:
        with open(MAP_FILE, 'r') as f:
            map_data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading map file: {e}")
        return
    
    # Check for external tilesets
    tilesets = map_data.get('tilesets', [])
    external_tilesets = []
    embedded_tilesets = []
    
    for i, tileset in enumerate(tilesets):
        if 'source' in tileset:
            external_tilesets.append((i, tileset))
            print(f"❌ External tileset found: {tileset.get('source', 'unknown')} (firstgid: {tileset.get('firstgid', 'unknown')})")
        else:
            embedded_tilesets.append((i, tileset))
            print(f"✅ Embedded tileset: {tileset.get('name', 'unknown')} (firstgid: {tileset.get('firstgid', 'unknown')})")
    
    print()
    
    if not external_tilesets:
        print("✅ No external tileset references found!")
        print("The map is already clean.")
        # Remove backup since no changes were made
        os.remove(BACKUP_FILE)
        print(f"🗑️ Removed unnecessary backup: {BACKUP_FILE}")
        return
    
    print(f"🚨 Found {len(external_tilesets)} external tileset references")
    print(f"✅ Found {len(embedded_tilesets)} embedded tilesets")
    
    # Remove external tilesets (in reverse order to maintain indices)
    removed_count = 0
    for i, tileset in reversed(external_tilesets):
        tileset_name = tileset.get('name', 'unknown')
        tileset_source = tileset.get('source', 'unknown')
        firstgid = tileset.get('firstgid', 'unknown')
        
        print(f"🗑️ Removing external tileset: {tileset_name} (source: {tileset_source}, firstgid: {firstgid})")
        tilesets.pop(i)
        removed_count += 1
    
    # Update the map data
    map_data['tilesets'] = tilesets
    
    print()
    print(f"✅ Successfully removed {removed_count} external tileset references")
    
    # Write cleaned map file
    try:
        with open(MAP_FILE, 'w') as f:
            json.dump(map_data, f, indent=2)
        
        print(f"💾 Updated map file: {MAP_FILE}")
        print(f"📁 Backup created: {BACKUP_FILE}")
        
        print()
        print("📊 Remaining tilesets:")
        for tileset in tilesets:
            name = tileset.get('name', 'unknown')
            firstgid = tileset.get('firstgid', 'unknown')
            tilecount = tileset.get('tilecount', 'unknown')
            print(f"  {name}: firstgid={firstgid}, tilecount={tilecount}")
        
        print()
        print("🎯 Next steps:")
        print("1. Test the game - it should now load without external tileset errors")
        print("2. If you need the removed tileset, re-embed it in Tiled Editor")
        print("3. Save the map after making any changes")
        
    except Exception as e:
        print(f"❌ Error writing cleaned map file: {e}")
        print(f"🔄 Restoring from backup...")
        shutil.copy2(BACKUP_FILE, MAP_FILE)
        return

if __name__ == "__main__":
    main()
