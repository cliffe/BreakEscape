#!/usr/bin/env python3

import json
import os

"""
Script to identify corrupted GID references in Tiled map
This will help find objects that reference non-existent tileset entries
"""

MAP_FILE = "assets/rooms/room_reception2.json"

def get_valid_gid_ranges(map_data):
    """Get all valid GID ranges from tilesets"""
    valid_ranges = []
    
    for tileset in map_data.get('tilesets', []):
        firstgid = tileset.get('firstgid', 0)
        tilecount = tileset.get('tilecount', 0)
        
        if tilecount:
            max_gid = firstgid + tilecount
            valid_ranges.append((firstgid, max_gid, tileset.get('name', 'unknown')))
        else:
            # Handle tilesets with undefined tilecount
            valid_ranges.append((firstgid, firstgid + 1, tileset.get('name', 'unknown')))
    
    return valid_ranges

def is_gid_valid(gid, valid_ranges):
    """Check if a GID is valid (exists in any tileset)"""
    for start, end, name in valid_ranges:
        if start <= gid < end:
            return True, name
    return False, None

def check_layer_objects(layer_name, objects, valid_ranges):
    """Check objects in a layer for invalid GIDs"""
    corrupted_objects = []
    
    for obj in objects:
        gid = obj.get('gid', 0)
        if gid > 0:  # Only check objects with GIDs
            is_valid, tileset_name = is_gid_valid(gid, valid_ranges)
            if not is_valid:
                corrupted_objects.append({
                    'id': obj.get('id', 'unknown'),
                    'gid': gid,
                    'x': obj.get('x', 0),
                    'y': obj.get('y', 0),
                    'name': obj.get('name', ''),
                    'layer': layer_name
                })
    
    return corrupted_objects

def main():
    """Main function to check for corrupted GIDs"""
    print("🔍 Checking for Corrupted GID References")
    print("=" * 50)
    
    if not os.path.exists(MAP_FILE):
        print(f"❌ Map file not found: {MAP_FILE}")
        return
    
    try:
        with open(MAP_FILE, 'r') as f:
            map_data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading map file: {e}")
        return
    
    # Get valid GID ranges
    valid_ranges = get_valid_gid_ranges(map_data)
    print(f"📊 Found {len(valid_ranges)} tilesets with valid GID ranges:")
    for start, end, name in valid_ranges:
        print(f"  {name}: GIDs {start}-{end-1}")
    
    print()
    
    # Check each layer
    all_corrupted = []
    
    for layer in map_data.get('layers', []):
        layer_name = layer.get('name', 'unknown')
        objects = layer.get('objects', [])
        
        if objects:
            corrupted = check_layer_objects(layer_name, objects, valid_ranges)
            if corrupted:
                all_corrupted.extend(corrupted)
                print(f"❌ Layer '{layer_name}': {len(corrupted)} corrupted objects")
                for obj in corrupted[:5]:  # Show first 5
                    print(f"    - Object ID {obj['id']}: GID {obj['gid']} at ({obj['x']}, {obj['y']})")
                if len(corrupted) > 5:
                    print(f"    ... and {len(corrupted) - 5} more")
            else:
                print(f"✅ Layer '{layer_name}': All objects valid")
    
    print()
    
    if all_corrupted:
        print(f"🚨 Found {len(all_corrupted)} corrupted objects total")
        print()
        print("📋 Summary by GID:")
        
        # Group by GID
        gid_counts = {}
        for obj in all_corrupted:
            gid = obj['gid']
            if gid not in gid_counts:
                gid_counts[gid] = []
            gid_counts[gid].append(obj)
        
        for gid in sorted(gid_counts.keys()):
            count = len(gid_counts[gid])
            print(f"  GID {gid}: {count} objects")
        
        print()
        print("🔧 Recommended Actions:")
        print("1. Open the map in Tiled Editor")
        print("2. Look for pink/magenta placeholder tiles")
        print("3. Replace corrupted objects with valid ones from the tileset")
        print("4. Save the map")
        
    else:
        print("✅ No corrupted GID references found!")
        print("The map should work correctly in Phaser.")

if __name__ == "__main__":
    main()
