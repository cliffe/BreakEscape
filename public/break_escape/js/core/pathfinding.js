// Pathfinding System
// Handles pathfinding and navigation

// Pathfinding system using EasyStar.js
import { GRID_SIZE, TILE_SIZE } from '../utils/constants.js';
// IMPORTANT: version must match all other imports of rooms.js — mismatched ?v= strings
// create separate module instances with separate rooms objects, causing state to diverge.
import { rooms } from './rooms.js';

let pathfinder = null;
let gameRef = null;

export function initializePathfinder(gameInstance) {
    gameRef = gameInstance;
    console.log('Initializing pathfinder');
    
    const worldBounds = gameInstance.physics.world.bounds;
    const gridWidth = Math.ceil(worldBounds.width / GRID_SIZE);
    const gridHeight = Math.ceil(worldBounds.height / GRID_SIZE);
    
    try {
        pathfinder = new EasyStar.js();
        const grid = Array(gridHeight).fill().map(() => Array(gridWidth).fill(0));
        
        // Mark walls
        Object.values(rooms).forEach(room => {
            room.wallsLayers.forEach(wallLayer => {
                wallLayer.getTilesWithin().forEach(tile => {
                    // Only mark as unwalkable if the tile collides AND hasn't been disabled for doors
                    if (tile.collides && tile.canCollide) {  // Add check for canCollide
                        const gridX = Math.floor((tile.x * TILE_SIZE + wallLayer.x - worldBounds.x) / GRID_SIZE);
                        const gridY = Math.floor((tile.y * TILE_SIZE + wallLayer.y - worldBounds.y) / GRID_SIZE);
                        
                        if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
                            grid[gridY][gridX] = 1;
                        }
                    }
                });
            });
        });

        pathfinder.setGrid(grid);
        pathfinder.setAcceptableTiles([0]);
        pathfinder.enableDiagonals();
        
        console.log('Pathfinding initialized successfully');
    } catch (error) {
        console.error('Error initializing pathfinder:', error);
    }
}

export function findPath(startX, startY, endX, endY, callback) {
    if (!pathfinder) {
        console.warn('Pathfinder not initialized');
        return;
    }
    
    const worldBounds = gameRef.physics.world.bounds;
    
    // Convert world coordinates to grid coordinates
    const startGridX = Math.floor((startX - worldBounds.x) / GRID_SIZE);
    const startGridY = Math.floor((startY - worldBounds.y) / GRID_SIZE);
    const endGridX = Math.floor((endX - worldBounds.x) / GRID_SIZE);
    const endGridY = Math.floor((endY - worldBounds.y) / GRID_SIZE);
    
    pathfinder.findPath(startGridX, startGridY, endGridX, endGridY, (path) => {
        if (path && path.length > 0) {
            // Convert back to world coordinates
            const worldPath = path.map(point => ({
                x: point.x * GRID_SIZE + worldBounds.x + GRID_SIZE / 2,
                y: point.y * GRID_SIZE + worldBounds.y + GRID_SIZE / 2
            }));
            
            // Smooth the path
            const smoothedPath = smoothPath(worldPath);
            callback(smoothedPath);
        } else {
            callback(null);
        }
    });
    
    pathfinder.calculate();
}

function smoothPath(path) {
    if (path.length <= 2) return path;
    
    const smoothed = [path[0]];
    for (let i = 1; i < path.length - 1; i++) {
        const prev = path[i - 1];
        const current = path[i];
        const next = path[i + 1];
        
        // Calculate the angle change
        const angle1 = Phaser.Math.Angle.Between(prev.x, prev.y, current.x, current.y);
        const angle2 = Phaser.Math.Angle.Between(current.x, current.y, next.x, next.y);
        const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle1 - angle2));
        
        // Only keep points where there's a significant direction change
        if (angleDiff > 0.2) { // About 11.5 degrees
            smoothed.push(current);
        }
    }
    smoothed.push(path[path.length - 1]);
    
    return smoothed;
}

export function debugPath(path) {
    if (!path) return;
    console.log('Current path:', {
        pathLength: path.length,
        currentTarget: path[0],
        // playerPos: { x: player.x, y: player.y },
        // isMoving: isMoving
    });
}

// Export for global access
window.initializePathfinder = initializePathfinder; 