#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to update Tiled map with all objects from assets directory
 * This ensures all objects are included in the tileset with proper GIDs
 */

const ASSETS_DIR = path.join(__dirname, '../assets/objects');
const MAP_FILE = path.join(__dirname, '../assets/rooms/room_reception2.json');

// Object types to include
const OBJECT_TYPES = [
    'bag', 'bin', 'briefcase', 'laptop', 'phone', 'pc', 'note', 'notes',
    'safe', 'suitcase', 'office-misc', 'plant', 'chair', 'picture', 'table'
];

function getAllObjectFiles() {
    const files = [];
    
    try {
        const entries = fs.readdirSync(ASSETS_DIR, { withFileTypes: true });
        
        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.png')) {
                const baseName = entry.name.replace('.png', '');
                const category = getObjectCategory(baseName);
                
                files.push({
                    filename: entry.name,
                    basename: baseName,
                    category: category,
                    path: `../objects/${entry.name}`
                });
            }
        }
    } catch (error) {
        console.error('Error reading assets directory:', error);
        return [];
    }
    
    return files.sort((a, b) => a.basename.localeCompare(b.basename));
}

function getObjectCategory(filename) {
    const baseName = filename.replace('.png', '');
    
    for (const type of OBJECT_TYPES) {
        if (baseName.includes(type)) {
            return type;
        }
    }
    
    return 'misc';
}

function findHighestGID(mapData) {
    let highestGID = 0;
    
    // Find the highest GID in the most recent objects tileset
    const objectsTilesets = mapData.tilesets.filter(ts => 
        ts.name === 'objects' || ts.name.includes('objects/')
    );
    
    if (objectsTilesets.length > 0) {
        const latestTileset = objectsTilesets[objectsTilesets.length - 1];
        highestGID = latestTileset.firstgid + (latestTileset.tilecount || 0);
    }
    
    return highestGID;
}

function createTilesetEntry(file, gid) {
    return {
        id: gid - 1, // Tiled uses 0-based indexing
        image: file.path,
        imageheight: 16, // Default size, will be updated by Tiled
        imagewidth: 16
    };
}

function updateMapFile(objectFiles) {
    try {
        const mapData = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
        
        // Find the latest objects tileset
        const objectsTilesets = mapData.tilesets.filter(ts => 
            ts.name === 'objects' || ts.name.includes('objects/')
        );
        
        if (objectsTilesets.length === 0) {
            console.error('No objects tileset found in map file');
            return;
        }
        
        const latestTileset = objectsTilesets[objectsTilesets.length - 1];
        const startGID = latestTileset.firstgid + (latestTileset.tilecount || 0);
        
        console.log(`Found latest objects tileset with firstgid: ${latestTileset.firstgid}`);
        console.log(`Current tilecount: ${latestTileset.tilecount || 0}`);
        console.log(`Next available GID: ${startGID}`);
        
        // Check which objects are missing
        const existingImages = new Set();
        if (latestTileset.tiles) {
            latestTileset.tiles.forEach(tile => {
                if (tile.image) {
                    const filename = path.basename(tile.image);
                    existingImages.add(filename);
                }
            });
        }
        
        const missingObjects = objectFiles.filter(file => 
            !existingImages.has(file.filename)
        );
        
        console.log(`Found ${objectFiles.length} total objects`);
        console.log(`Found ${existingImages.size} existing objects in tileset`);
        console.log(`Missing ${missingObjects.length} objects`);
        
        if (missingObjects.length === 0) {
            console.log('All objects are already in the tileset!');
            return;
        }
        
        // Add missing objects to tileset
        const newTiles = [];
        let currentGID = startGID;
        
        for (const file of missingObjects) {
            const tileEntry = createTilesetEntry(file, currentGID);
            newTiles.push(tileEntry);
            currentGID++;
        }
        
        // Update tileset
        if (!latestTileset.tiles) {
            latestTileset.tiles = [];
        }
        
        latestTileset.tiles.push(...newTiles);
        latestTileset.tilecount = (latestTileset.tilecount || 0) + newTiles.length;
        
        console.log(`Added ${newTiles.length} new objects to tileset`);
        console.log(`New tilecount: ${latestTileset.tilecount}`);
        
        // Write updated map file
        fs.writeFileSync(MAP_FILE, JSON.stringify(mapData, null, 2));
        console.log(`Updated map file: ${MAP_FILE}`);
        
        // Generate Tiled command to open the map
        console.log('\nNext steps:');
        console.log('1. Open the map in Tiled Editor');
        console.log('2. The new objects should be available in the tileset');
        console.log('3. Place objects in your layers as needed');
        console.log('4. Save the map');
        
    } catch (error) {
        console.error('Error updating map file:', error);
    }
}

function main() {
    console.log('🔧 Tileset Update Script');
    console.log('========================');
    
    // Check if assets directory exists
    if (!fs.existsSync(ASSETS_DIR)) {
        console.error(`Assets directory not found: ${ASSETS_DIR}`);
        process.exit(1);
    }
    
    // Check if map file exists
    if (!fs.existsSync(MAP_FILE)) {
        console.error(`Map file not found: ${MAP_FILE}`);
        process.exit(1);
    }
    
    console.log(`Scanning assets directory: ${ASSETS_DIR}`);
    const objectFiles = getAllObjectFiles();
    
    if (objectFiles.length === 0) {
        console.log('No object files found in assets directory');
        return;
    }
    
    console.log(`Found ${objectFiles.length} object files`);
    
    // Group by category
    const byCategory = {};
    objectFiles.forEach(file => {
        if (!byCategory[file.category]) {
            byCategory[file.category] = [];
        }
        byCategory[file.category].push(file);
    });
    
    console.log('\nObjects by category:');
    Object.entries(byCategory).forEach(([category, files]) => {
        console.log(`  ${category}: ${files.length} files`);
    });
    
    console.log('\nUpdating map file...');
    updateMapFile(objectFiles);
    
    console.log('\n✅ Script completed!');
}

if (require.main === module) {
    main();
}

module.exports = { getAllObjectFiles, updateMapFile };
