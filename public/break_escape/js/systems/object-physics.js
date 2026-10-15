/**
 * OBJECT PHYSICS SYSTEM
 * =====================
 * 
 * Handles physics bodies, collision setup, and object behavior for chairs and other objects.
 * Separated from rooms.js for better modularity and maintainability.
 */

import { TILE_SIZE } from '../utils/constants.js';

let gameRef = null;
let rooms = null;

// Initialize object physics system
export function initializeObjectPhysics(gameInstance, roomsRef) {
    gameRef = gameInstance;
    rooms = roomsRef;
}

// Set up collision detection between chairs and other objects
export function setupChairCollisions(chair) {
    if (!chair || !chair.body) return;
    
    // Ensure we have a valid game reference
    const game = gameRef || window.game;
    if (!game) {
        console.error('No game reference available, cannot set up chair collisions');
        return;
    }
    
    // Use window.rooms to ensure we see the latest state
    const allRooms = window.rooms || {};
    
    // Collision with other chairs
    if (window.chairs) {
        window.chairs.forEach(otherChair => {
            if (otherChair !== chair && otherChair.body) {
                game.physics.add.collider(chair, otherChair);
            }
        });
    }
    
    // Collision with tables and other static objects
    Object.values(allRooms).forEach(room => {
        if (room.objects) {
            Object.values(room.objects).forEach(obj => {
                if (obj !== chair && obj.body && obj.body.immovable) {
                    game.physics.add.collider(chair, obj);
                }
            });
        }
    });
    
    // Collision with wall collision boxes
    Object.values(allRooms).forEach(room => {
        if (room.wallCollisionBoxes) {
            room.wallCollisionBoxes.forEach(wallBox => {
                if (wallBox.body) {
                    // Add collision callback for swivel chairs to modify spin on wall hit
                    if (chair.isSwivelChair) {
                        game.physics.add.collider(chair, wallBox, () => {
                            handleChairWallCollision(chair);
                        });
                    } else {
                        game.physics.add.collider(chair, wallBox);
                    }
                }
            });
        }
    });
    
    // Collision with closed door sprites
    Object.values(allRooms).forEach(room => {
        if (room.doorSprites) {
            room.doorSprites.forEach(doorSprite => {
                // Only collide with closed doors (doors that haven't been opened)
                if (doorSprite.body && doorSprite.body.immovable) {
                    // Add collision callback for swivel chairs to modify spin on wall hit
                    if (chair.isSwivelChair) {
                        game.physics.add.collider(chair, doorSprite, () => {
                            handleChairWallCollision(chair);
                        });
                    } else {
                        game.physics.add.collider(chair, doorSprite);
                    }
                }
            });
        }
    });
}

// Set up collisions between existing chairs and new room objects
export function setupExistingChairsWithNewRoom(roomId) {
    if (!window.chairs) return;
    
    // Use window.rooms to ensure we see the latest state
    const room = window.rooms ? window.rooms[roomId] : null;
    if (!room) return;
    
    // Ensure we have a valid game reference
    const game = gameRef || window.game;
    if (!game) {
        console.error('No game reference available, cannot set up chair collisions');
        return;
    }
    
    // Collision with new room's tables and static objects
    if (room.objects) {
        Object.values(room.objects).forEach(obj => {
            if (obj.body && obj.body.immovable) {
                window.chairs.forEach(chair => {
                    if (chair.body) {
                        game.physics.add.collider(chair, obj);
                    }
                });
            }
        });
    }
    
    // Collision with new room's wall collision boxes
    if (room.wallCollisionBoxes) {
        room.wallCollisionBoxes.forEach(wallBox => {
            if (wallBox.body) {
                window.chairs.forEach(chair => {
                    if (chair.body) {
                        game.physics.add.collider(chair, wallBox);
                    }
                });
            }
        });
    }
    
    // Collision with new room's door sprites
    if (room.doorSprites) {
        room.doorSprites.forEach(doorSprite => {
            // Only collide with closed doors (doors that haven't been opened)
            if (doorSprite.body && doorSprite.body.immovable) {
                window.chairs.forEach(chair => {
                    if (chair.body) {
                        game.physics.add.collider(chair, doorSprite);
                    }
                });
            }
        });
    }
    
    console.log(`Set up chair collisions for room ${roomId} with ${window.chairs.length} existing chairs`);
}

// Handle collision between swivel chair and wall - modify spin on impact
function handleChairWallCollision(chair) {
    if (!chair.isSwivelChair) return;
    
    // Check if chair is actually moving - if velocity is near zero, don't process collision
    // This prevents continuous collision spam when chair is at rest against a wall
    const velocity = Math.sqrt(
        chair.body.velocity.x * chair.body.velocity.x + 
        chair.body.velocity.y * chair.body.velocity.y
    );
    
    // Only process collision if chair has meaningful velocity
    if (velocity < 5) {
        return; // Chair is at rest or moving too slowly - ignore collision
    }
    
    // When chair hits a wall, reverse the spin direction and give it a speed boost
    // This creates a dynamic "bounce" effect
    if (chair.spinDirection !== 0) {
        chair.spinDirection *= -1; // Reverse spin
        
        // Give spin animation a nudge - speed it up temporarily
        // Add a boost to the rotation speed (up to 30% faster, but cap at max)
        const speedBoost = 1.3;
        chair.rotationSpeed = Math.min(chair.rotationSpeed * speedBoost, chair.maxRotationSpeed);
        
        console.log('Chair hit wall - spin reversed with boost', {
            newDirection: chair.spinDirection,
            newRotationSpeed: chair.rotationSpeed,
            maxRotationSpeed: chair.maxRotationSpeed
        });
    }
}

// Calculate chair spin direction based on contact point
export function calculateChairSpinDirection(player, chair) {
    if (!chair.isSwivelChair) return;
    
    // Get relative position of player to chair SPRITE center (not collision box)
    const chairSpriteCenterX = chair.x + chair.width / 2;
    const chairSpriteCenterY = chair.y + chair.height / 2;
    const playerX = player.x + player.width / 2;
    const playerY = player.y + player.height / 2;
    
    // Calculate offset from chair sprite center
    const offsetX = playerX - chairSpriteCenterX;
    const offsetY = playerY - chairSpriteCenterY;
    
    // Calculate distance from center using sprite dimensions (not collision box)
    const distanceFromCenter = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    // Use the larger sprite dimension for maxDistance to make center area larger
    const maxDistance = Math.max(chair.width, chair.height) / 2;
    const centerRatio = distanceFromCenter / maxDistance;
    
    
    // Determine spin based on distance from center (EXTREMELY large center area)
    if (centerRatio > 1.2) { // 120% from center - edge hit (strong spin) - ONLY VERY EDGES
        // Determine spin direction based on which side of chair player is on
        if (Math.abs(offsetX) > Math.abs(offsetY)) {
            // Horizontal contact - spin based on X offset
            chair.spinDirection = offsetX > 0 ? 1 : -1; // Right side = clockwise, left side = counter-clockwise
        } else {
            // Vertical contact - spin based on Y offset and player movement
            const playerVelocityX = player.body.velocity.x;
            if (Math.abs(playerVelocityX) > 10) {
                // Player is moving horizontally - use that for spin direction
                chair.spinDirection = playerVelocityX > 0 ? 1 : -1;
            } else {
                // Use Y offset for spin direction
                chair.spinDirection = offsetY > 0 ? 1 : -1;
            }
        }
        
        // Strong spin for edge hits
        const spinIntensity = Math.min(centerRatio, 1.0);
        chair.maxRotationSpeed = 0.15 * spinIntensity;
        chair.rotationSpeed = Math.max(chair.rotationSpeed, 0.05); // Strong rotation start
        
        
    } else if (centerRatio > 0.8) { // 80-120% from center - moderate hit
        // Moderate spin
        if (Math.abs(offsetX) > Math.abs(offsetY)) {
            chair.spinDirection = offsetX > 0 ? 1 : -1;
        } else {
            const playerVelocityX = player.body.velocity.x;
            chair.spinDirection = Math.abs(playerVelocityX) > 10 ? (playerVelocityX > 0 ? 1 : -1) : (offsetY > 0 ? 1 : -1);
        }
        
        const spinIntensity = centerRatio * 0.3; // Reduced intensity
        chair.maxRotationSpeed = 0.06 * spinIntensity;
        chair.rotationSpeed = Math.max(chair.rotationSpeed, 0.015); // Moderate rotation start
        
        
    } else { // 0-80% from center - center hit (minimal spin) - MASSIVE CENTER AREA
        // Very minimal or no spin for center hits
        chair.spinDirection = 0;
        chair.maxRotationSpeed = 0.01; // Very slow spin
        chair.rotationSpeed = Math.max(chair.rotationSpeed, 0.002); // Minimal rotation start
        
    }
}

// Update swivel chair rotation based on movement
export function updateSwivelChairRotation() {
    if (!window.chairs) return;
    
    // Ensure we have a valid game reference
    const game = gameRef || window.game;
    if (!game) return; // Silently return if no game reference
    
    window.chairs.forEach(chair => {
        if (!chair.hasWheels || !chair.body) return;
        
        // Update chair depth based on current position (for all chairs with wheels)
        updateSpriteDepth(chair, chair.elevation || 0);
        
        // Only process rotation for swivel chairs
        if (!chair.isSwivelChair) return;
        
        // Calculate movement speed
        const velocity = Math.sqrt(
            chair.body.velocity.x * chair.body.velocity.x + 
            chair.body.velocity.y * chair.body.velocity.y
        );
        
        // Update rotation speed based on movement
        if (velocity > 10) {
            // Chair is moving - increase rotation speed (slower acceleration)
            chair.rotationSpeed = Math.min(chair.rotationSpeed + 0.01, chair.maxRotationSpeed);
            
            // If no spin direction set, set a default one for testing
            if (chair.spinDirection === 0) {
                chair.spinDirection = 1; // Default to clockwise
            }
        } else {
            // Chair is slowing down - decrease rotation speed (slower deceleration)
            chair.rotationSpeed = Math.max(chair.rotationSpeed - 0.005, 0);
            
            // Reset spin direction when chair stops moving
            if (chair.rotationSpeed < 0.01) {
                chair.spinDirection = 0;
            }
        }
        
        // Update frame based on rotation speed and direction
        if (chair.rotationSpeed > 0.01) {
            // Apply spin direction to rotation
            const rotationDelta = chair.rotationSpeed * chair.spinDirection;
            chair.currentFrame += rotationDelta;
            
            // Handle frame wrapping (8 frames total: 0-7)
            if (chair.currentFrame >= 8) {
                chair.currentFrame = 0; // Loop back to first frame
            } else if (chair.currentFrame < 0) {
                chair.currentFrame = 7; // Loop back to last frame (for counter-clockwise)
            }
            
            // Set the texture based on current frame and prop type
            const frameIndex = Math.floor(chair.currentFrame) + 1; // Convert to 1-based index

            // Derive the rotation base by stripping the trailing frame number from the
            // original texture (e.g. "crash-cart-rotate1" -> "crash-cart-rotate"). This
            // works for every "<base>-rotate<N>" prop: exec/white chairs, crash cart, etc.
            const base = chair.originalTexture
                ? chair.originalTexture.replace(/\d+$/, '')
                : 'chair-exec-rotate';
            const newTexture = `${base}${frameIndex}`;
            
            // Check if texture exists before setting
            if (game.textures.exists(newTexture)) {
                chair.setTexture(newTexture);
            } else {
                console.warn(`Texture not found: ${newTexture}`);
            }
        }
    });
}

// Reusable function to update sprite depth based on Y position and elevation
export function updateSpriteDepth(sprite, elevation = 0) {
    if (!sprite || !sprite.active) return;
    
    // Get the bottom of the sprite (feet position)
    const spriteBottomY = sprite.y + (sprite.height * sprite.scaleY);
    
    // Calculate depth: world Y position + layer offset + elevation
    const spriteDepth = spriteBottomY + 0.5 + elevation;
    
    // Set the sprite depth
    sprite.setDepth(spriteDepth);
}

// Export for global access
window.setupChairCollisions = setupChairCollisions;
window.setupExistingChairsWithNewRoom = setupExistingChairsWithNewRoom;
window.calculateChairSpinDirection = calculateChairSpinDirection;
window.updateSwivelChairRotation = updateSwivelChairRotation;
window.updateSpriteDepth = updateSpriteDepth;
