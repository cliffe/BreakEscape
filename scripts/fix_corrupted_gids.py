#!/usr/bin/env python3

import json
import os
import shutil
from datetime import datetime

"""
Script to remove objects with corrupted GID references from Tiled map
This will clean up the JSON file by removing objects that reference non-existent tileset entries
"""

MAP_FILE = "assets/rooms/room_reception2.json"
BACKUP_FILE = f"assets/rooms/room_reception2.json.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

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

def clean_layer_objects(layer_name, objects, valid_ranges):
    """Remove objects with invalid GIDs from a layer"""
    original_count = len(objects)
    valid_objects = []
    removed_objects = []
    
    for obj in objects:
        gid = obj.get('gid', 0)
        if gid > 0:  # Only check objects with GIDs
            is_valid, tileset_name = is_gid_valid(gid, valid_ranges)
            if is_valid:
                valid_objects.append(obj)
            else:
                removed_objects.append({
                    'id': obj.get('id', 'unknown'),
                    'gid': gid,
                    'x': obj.get('x', 0),
                    'y': obj.get('y', 0),
                    'name': obj.get('name', ''),
                    'layer': layer_name
                })
        else:
            # Keep objects without GIDs (like collision shapes, etc.)
            valid_objects.append(obj)
    
    removed_count = original_count - len(valid_objects)
    return valid_objects, removed_objects, removed_count

def main():
    """Main function to clean corrupted GIDs"""
    print("🧹 Cleaning Corrupted GID References")
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
    
    # Get valid GID ranges
    valid_ranges = get_valid_gid_ranges(map_data)
    print(f"📊 Valid GID ranges:")
    for start, end, name in valid_ranges:
        print(f"  {name}: GIDs {start}-{end-1}")
    
    print()
    
    # Clean each layer
    total_removed = 0
    all_removed_objects = []
    
    for layer in map_data.get('layers', []):
        layer_name = layer.get('name', 'unknown')
        objects = layer.get('objects', [])
        
        if objects:
            valid_objects, removed_objects, removed_count = clean_layer_objects(layer_name, objects, valid_ranges)
            
            if removed_count > 0:
                # Update the layer with cleaned objects
                layer['objects'] = valid_objects
                total_removed += removed_count
                all_removed_objects.extend(removed_objects)
                
                print(f"🧹 Layer '{layer_name}': Removed {removed_count} corrupted objects")
                for obj in removed_objects:
                    print(f"    - Object ID {obj['id']}: GID {obj['gid']} at ({obj['x']}, {obj['y']})")
            else:
                print(f"✅ Layer '{layer_name}': No corrupted objects found")
    
    print()
    
    if total_removed > 0:
        # Write cleaned map file
        try:
            with open(MAP_FILE, 'w') as f:
                json.dump(map_data, f, indent=2)
            
            print(f"✅ Successfully removed {total_removed} corrupted objects")
            print(f"💾 Updated map file: {MAP_FILE}")
            print(f"📁 Backup created: {BACKUP_FILE}")
            
            print()
            print("📋 Summary of removed objects:")
            gid_counts = {}
            for obj in all_removed_objects:
                gid = obj['gid']
                if gid not in gid_counts:
                    gid_counts[gid] = 0
                gid_counts[gid] += 1
            
            for gid in sorted(gid_counts.keys()):
                count = gid_counts[gid]
                print(f"  GID {gid}: {count} objects removed")
            
            print()
            print("🎯 Next steps:")
            print("1. Open the map in Tiled Editor to verify the cleanup")
            print("2. Add any missing objects back using valid tileset entries")
            print("3. Save the map")
            print("4. Test the game to ensure it loads without errors")
            
        except Exception as e:
            print(f"❌ Error writing cleaned map file: {e}")
            print(f"🔄 Restoring from backup...")
            shutil.copy2(BACKUP_FILE, MAP_FILE)
            return
    
    else:
        print("✅ No corrupted objects found!")
        print("The map is already clean.")
        # Remove backup since no changes were made
        os.remove(BACKUP_FILE)
        print(f"🗑️ Removed unnecessary backup: {BACKUP_FILE}")

if __name__ == "__main__":
    main()
