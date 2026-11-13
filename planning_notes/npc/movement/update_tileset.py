#!/usr/bin/env python3

import os
import json
import glob
from pathlib import Path

"""
Script to update Tiled map with all objects from assets directory
This ensures all objects are included in the tileset with proper GIDs
"""

ASSETS_DIR = "assets/objects"
MAP_FILE = "assets/rooms/room_reception2.json"

# Object types to include
OBJECT_TYPES = [
    'bag', 'bin', 'briefcase', 'laptop', 'phone', 'pc', 'note', 'notes',
    'safe', 'suitcase', 'office-misc', 'plant', 'chair', 'picture', 'table'
]

def get_all_object_files():
    """Get all object files from the assets directory"""
    files = []
    
    if not os.path.exists(ASSETS_DIR):
        print(f"❌ Assets directory not found: {ASSETS_DIR}")
        return files
    
    for file_path in glob.glob(os.path.join(ASSETS_DIR, "*.png")):
        filename = os.path.basename(file_path)
        basename = filename.replace('.png', '')
        category = get_object_category(basename)
        
        files.append({
            'filename': filename,
            'basename': basename,
            'category': category,
            'path': f"../objects/{filename}"
        })
    
    return sorted(files, key=lambda x: x['basename'])

def get_object_category(filename):
    """Determine the category of an object based on its filename"""
    for obj_type in OBJECT_TYPES:
        if obj_type in filename:
            return obj_type
    return 'misc'

def find_latest_objects_tileset(map_data):
    """Find the latest objects tileset in the map data"""
    objects_tilesets = []
    
    for tileset in map_data.get('tilesets', []):
        if tileset.get('name') == 'objects' or 'objects/' in tileset.get('name', ''):
            objects_tilesets.append(tileset)
    
    if not objects_tilesets:
        return None
    
    # Return the last one (most recent)
    return objects_tilesets[-1]

def create_tileset_entry(file_info, gid):
    """Create a tileset entry for a file"""
    return {
        "id": gid - 1,  # Tiled uses 0-based indexing
        "image": file_info['path'],
        "imageheight": 16,  # Default size, will be updated by Tiled
        "imagewidth": 16
    }

def update_map_file(object_files):
    """Update the map file with missing objects"""
    try:
        with open(MAP_FILE, 'r') as f:
            map_data = json.load(f)
        
        # Find the latest objects tileset
        latest_tileset = find_latest_objects_tileset(map_data)
        
        if not latest_tileset:
            print("❌ No objects tileset found in map file")
            return False
        
        print(f"📋 Found latest objects tileset with firstgid: {latest_tileset.get('firstgid', 0)}")
        print(f"📊 Current tilecount: {latest_tileset.get('tilecount', 0)}")
        
        # Check which objects are missing
        existing_images = set()
        if 'tiles' in latest_tileset:
            for tile in latest_tileset['tiles']:
                if 'image' in tile:
                    filename = os.path.basename(tile['image'])
                    existing_images.add(filename)
        
        missing_objects = [f for f in object_files if f['filename'] not in existing_images]
        
        print(f"📁 Found {len(object_files)} total objects")
        print(f"✅ Found {len(existing_images)} existing objects in tileset")
        print(f"❌ Missing {len(missing_objects)} objects")
        
        if not missing_objects:
            print("🎉 All objects are already in the tileset!")
            return True
        
        # Add missing objects to tileset
        start_gid = latest_tileset.get('firstgid', 0) + latest_tileset.get('tilecount', 0)
        new_tiles = []
        
        for i, file_info in enumerate(missing_objects):
            gid = start_gid + i
            tile_entry = create_tileset_entry(file_info, gid)
            new_tiles.append(tile_entry)
        
        # Update tileset
        if 'tiles' not in latest_tileset:
            latest_tileset['tiles'] = []
        
        latest_tileset['tiles'].extend(new_tiles)
        latest_tileset['tilecount'] = latest_tileset.get('tilecount', 0) + len(new_tiles)
        
        print(f"➕ Added {len(new_tiles)} new objects to tileset")
        print(f"📊 New tilecount: {latest_tileset['tilecount']}")
        
        # Write updated map file
        with open(MAP_FILE, 'w') as f:
            json.dump(map_data, f, indent=2)
        
        print(f"💾 Updated map file: {MAP_FILE}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating map file: {e}")
        return False

def main():
    """Main function"""
    print("🔧 Tileset Update Script")
    print("========================")
    
    # Check if map file exists
    if not os.path.exists(MAP_FILE):
        print(f"❌ Map file not found: {MAP_FILE}")
        return
    
    print(f"📂 Scanning assets directory: {ASSETS_DIR}")
    object_files = get_all_object_files()
    
    if not object_files:
        print("❌ No object files found in assets directory")
        return
    
    print(f"📁 Found {len(object_files)} object files")
    
    # Group by category
    by_category = {}
    for file_info in object_files:
        category = file_info['category']
        if category not in by_category:
            by_category[category] = []
        by_category[category].append(file_info)
    
    print("\n📊 Objects by category:")
    for category, files in by_category.items():
        print(f"  {category}: {len(files)} files")
    
    print("\n🔄 Updating map file...")
    success = update_map_file(object_files)
    
    if success:
        print("\n✅ Script completed successfully!")
        print("\n📝 Next steps:")
        print("1. Open the map in Tiled Editor")
        print("2. Check that all objects are available in the tileset")
        print("3. Place any missing objects in your layers")
        print("4. Save the map")
        print("\n🎯 This script ensures all objects from assets/objects/ are included in the tileset!")
    else:
        print("\n❌ Script failed. Please check the errors above.")

if __name__ == "__main__":
    main()
