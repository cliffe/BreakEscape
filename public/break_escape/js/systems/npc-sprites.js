/**
 * NPCSpriteManager - NPC Sprite Creation and Management
 * 
 * Manages creation, positioning, animation, and lifecycle of NPC sprites
 * in the game world.
 * 
 * @module npc-sprites
 */

import { TILE_SIZE, SPRITE_PADDING_BOTTOM_ATLAS, SPRITE_PADDING_BOTTOM_LEGACY } from '../utils/constants.js';

/**
 * Create an NPC sprite in the game world
 * @param {Phaser.Scene} scene - Phaser scene instance
 * @param {Object} npc - NPC data from scenario
 * @param {Object} roomData - Room information (position, ID, etc.)
 * @returns {Phaser.Sprite|null} Created sprite instance or null if invalid
 */
export function createNPCSprite(scene, npc, roomData) {
    if (!npc || !npc.id) {
        console.warn('❌ Cannot create NPC sprite: invalid NPC data');
        return null;
    }
    
    try {
        // Extract sprite configuration
        const spriteSheet = npc.spriteSheet || 'hacker';
        const config = npc.spriteConfig || {};
        
        // Verify texture exists
        if (!scene.textures.exists(spriteSheet)) {
            console.warn(`❌ NPC ${npc.id}: sprite sheet "${spriteSheet}" not found`);
            return null;
        }
        
        // Calculate world position
        const worldPos = calculateNPCWorldPosition(npc, roomData);
        if (!worldPos) {
            console.warn(`❌ NPC ${npc.id}: invalid position configuration`);
            return null;
        }
        
        // Check if this is an atlas sprite (80x80) or legacy sprite (64x64)
        // Atlas sprites have named frames like "breathing-idle_south_frame_000"
        const texture = scene.textures.get(spriteSheet);
        const frames = texture.getFrameNames();
        
        // More robust atlas detection
        let isAtlas = false;
        if (frames.length > 0) {
            const firstFrame = frames[0];
            // Atlas frames are strings with underscores and "frame_" pattern
            isAtlas = typeof firstFrame === 'string' && 
                     (firstFrame.includes('breathing-idle') || 
                      firstFrame.includes('walk_') || 
                      firstFrame.includes('_frame_'));
        }
        
        console.log(`🔍 NPC ${npc.id}: ${frames.length} frames, first frame: "${frames[0]}", isAtlas: ${isAtlas}`);
        
        // Determine initial frame
        let initialFrame;
        if (isAtlas) {
            // Atlas sprite - find first breathing-idle_south frame
            const breathingIdleFrames = frames.filter(f => typeof f === 'string' && f.includes('breathing-idle_south_frame_'));
            if (breathingIdleFrames.length > 0) {
                initialFrame = breathingIdleFrames.sort()[0];
            } else {
                // Fallback to first frame in atlas
                initialFrame = frames[0];
            }
        } else {
            // Legacy sprite - use configured frame or default to 20
            initialFrame = config.idleFrame ?? 20;   // ?? so a configured frame 0 is kept
        }
        
        // Create sprite
        const sprite = scene.add.sprite(worldPos.x, worldPos.y, spriteSheet, initialFrame);
        sprite.npcId = npc.id; // Tag for identification
        sprite._isNPC = true; // Mark as NPC sprite
        sprite.isAtlas = isAtlas; // Store for depth calculation
        
        console.log(`🎭 NPC ${npc.id} created with ${isAtlas ? 'atlas' : 'legacy'} sprite (${spriteSheet}), initial frame: ${initialFrame}`);
        
        // Enable physics
        scene.physics.add.existing(sprite);
        
        // Set collision box - three cases: static prop, atlas character, legacy character
        if (npc.behavior?.staticSprite === true) {
            // Interaction reach also measures to this body (npc-reach.js), since a
            // large body can hold the player out of centre-to-centre range.
            sprite._staticNpc = true;
            if (npc.behavior?.collisionBox === 'bottom_half') {
                // Collision body covers only the bottom half of the sprite.
                // bodyYOffset correction (below) = h/2 + h/4 - h/2 = h/4, so the sprite
                // shifts up by h/4 to keep body.center at worldPos.
                sprite.body.setSize(sprite.displayWidth, sprite.displayHeight / 2);
                sprite.body.setOffset(0, sprite.displayHeight / 2);
            } else {
                // Full sprite body (default): body covers the full sprite.
                // setOffset(0,0) + halfSize == displaySize/2 => bodyOffset correction below == 0,
                // so the sprite stays exactly at worldPos with no shift.
                sprite.body.setSize(sprite.displayWidth, sprite.displayHeight);
                sprite.body.setOffset(0, 0);
            }
        } else if (isAtlas) {
            // 80x80 sprite - collision box at feet
            sprite.body.setSize(20, 10); // Slightly wider for better collision
            sprite.body.setOffset(30, 66); // Center horizontally (80-20)/2=30, feet at bottom 80-14=66
        } else {
            // 64x64 sprite - legacy collision box
            sprite.body.setSize(18, 10);
            sprite.body.setOffset(23, 50); // Legacy offset for 64px sprite
        }

        // Tile coordinates mean "feet (body.center) at that position".
        // The sprite was created with its visual centre at worldPos, but body.center sits
        // below the visual centre by (offset.y + halfHeight - displayHeight * originY).
        // Shift the sprite up so that body.center lands exactly on worldPos.
        // (For staticSprite this correction is always 0 by construction above.)
        const bodyXOffset = sprite.body.offset.x + sprite.body.halfWidth  - sprite.displayWidth  * sprite.originX;
        const bodyYOffset = sprite.body.offset.y + sprite.body.halfHeight - sprite.displayHeight * sprite.originY;
        sprite.x -= bodyXOffset;
        sprite.y -= bodyYOffset;
        
        // Add friction to prevent NPCs from sliding far when pushed
        // Use VERY HIGH friction (low drag value) to stop NPCs quickly
        // drag = 0.0 is max friction, drag = 1.0 is no friction
        // 0.01 = 99% friction per frame = stops in ~1 frame
        sprite.body.setDrag(0.01, 0.01); // 99% friction on both axes
        sprite.body.setBounce(0, 0); // No bouncing on collision
        sprite.body.setMaxVelocity(200, 200); // Cap maximum velocity (patrol speed + collision impulse) // Drag: 0.95 = lose 95% of velocity per second

        // Immovable physics: stationary bed NPCs or fixed-position characters
        // Sets Phaser.Physics.Arcade.Components.Immovable — body cannot be pushed by collisions
        if (npc.behavior?.immovable === true) {
            sprite.body.setImmovable(true);
            console.log(`🪨 NPC ${npc.id} set as immovable`);
        }
        
        // Static prop sprites have no animation — skip setup entirely
        if (npc.behavior?.staticSprite !== true) {
            setupNPCAnimations(scene, sprite, spriteSheet, config, npc.id);
        }

        // Start idle animation (default facing down); static props have none
        const idleAnimKey = `npc-${npc.id}-idle`;
        if (npc.behavior?.staticSprite === true) {
            // stays on its initial frame
        } else if (scene.anims.exists(idleAnimKey)) {
            const anim = scene.anims.get(idleAnimKey);
            if (anim && anim.frames && anim.frames.length > 0) {
                sprite.play(idleAnimKey, true);
                console.log(`▶️ [${npc.id}] Playing initial idle animation: ${idleAnimKey}`);
            } else {
                console.warn(`⚠️ [${npc.id}] Idle animation exists but has no frames: ${idleAnimKey}`);
                // Try alternate idle animation
                const idleDownKey = `npc-${npc.id}-idle-down`;
                if (scene.anims.exists(idleDownKey)) {
                    sprite.play(idleDownKey, true);
                    console.log(`▶️ [${npc.id}] Playing fallback idle-down animation`);
                }
            }
        } else {
            console.warn(`⚠️ [${npc.id}] Idle animation not found: ${idleAnimKey}`);
            // Try alternate idle animation
            const idleDownKey = `npc-${npc.id}-idle-down`;
            if (scene.anims.exists(idleDownKey)) {
                sprite.play(idleDownKey, true);
                console.log(`▶️ [${npc.id}] Playing fallback idle-down animation`);
            }
        }
        
        // Set depth (same system as player: bottomY + 0.5)
        updateNPCDepth(sprite);
        
        // Store reference in NPC data for later access
        npc._sprite = sprite;
        
        // Check if NPC was previously defeated (KO state persisted from server)
        if (window.npcHostileSystem && window.npcHostileSystem.isNPCKO(npc.id)) {
            console.log(`💀 NPC ${npc.id} is KO'd - disabling sprite and playing death animation`);
            
            // Disable collision immediately
            if (sprite.body) {
                sprite.body.setVelocity(0, 0);
                sprite.body.checkCollision.none = true;
                sprite.body.enable = false;
            }
            
            // Play death animation if available
            const direction = getNPCDirection(npc.id, sprite);
            const deathAnimKey = `npc-${npc.id}-death-${direction}`;
            
            if (scene.anims.exists(deathAnimKey)) {
                // Stop current animation
                if (sprite.anims.isPlaying) {
                    sprite.anims.stop();
                }
                
                // Play final frame of death animation (skip to end)
                sprite.play(deathAnimKey);
                // Jump to last frame to show defeated state
                const anim = scene.anims.get(deathAnimKey);
                if (anim && anim.frames && anim.frames.length > 0) {
                    sprite.anims.setProgress(1); // Jump to final frame
                }
                console.log(`💀 NPC ${npc.id} rendered with death animation final frame`);
            } else {
                // No death animation - just hide the sprite
                sprite.setVisible(false);
                console.log(`💀 NPC ${npc.id} hidden (no death animation found)`);
            }
        }
        // Check if NPC visibility state was persisted from previous session (e.g., revealed by event)
        else if (npc.isVisible === false) {
            sprite.setVisible(false);
            // Also disable collision and physics for hidden NPCs
            if (sprite.body) {
                sprite.body.enable = false;
            }
            console.log(`👻 NPC ${npc.id} restored from hidden state (npc.isVisible: false)`);
        }
        // Check if NPC should be initially hidden (cutscene-only NPCs revealed by events)
        else if (npc.behavior?.initiallyHidden === true && npc.isVisible !== true) {
            sprite.setVisible(false);
            // Also disable collision and physics for hidden NPCs
            if (sprite.body) {
                sprite.body.enable = false;
            }
            console.log(`👻 NPC ${npc.id} initially hidden (behavior.initiallyHidden: true)`);
        }
        
        console.log(`✅ NPC sprite created: ${npc.id} at (${worldPos.x}, ${worldPos.y})`);
        
        return sprite;
    } catch (error) {
        console.error(`❌ Error creating NPC sprite for ${npc.id}:`, error);
        return null;
    }
}

/**
 * Get NPC's current facing direction
 * @param {string} npcId - The NPC ID
 * @param {Phaser.GameObjects.Sprite} sprite - The NPC sprite (optional, will look up if not provided)
 * @returns {string} Direction string (e.g., 'down', 'up', 'left', 'right', etc.)
 */
export function getNPCDirection(npcId, sprite = null) {
  // Try to get direction from behavior system first
  if (window.npcBehaviorManager) {
    const behavior = window.npcBehaviorManager.getBehavior(npcId);
    if (behavior && behavior.direction) {
      return behavior.direction;
    }
  }
  
  // Fallback to checking sprite's current animation
  if (!sprite) {
    const npc = window.npcManager?.getNPC(npcId);
    sprite = npc?._sprite || npc?.sprite;
  }
  
  if (sprite && sprite.anims && sprite.anims.currentAnim) {
    const animKey = sprite.anims.currentAnim.key;
    // Extract direction from animation key (e.g., "npc-sarah-idle-down" → "down")
    const parts = animKey.split('-');
    if (parts.length >= 3) {
      return parts[parts.length - 1];
    }
  }
  
  // Default to 'down' if we can't determine direction
  return 'down';
}

/**
 * Calculate NPC's world position from scenario data
 * 
 * Supports two position formats:
 * - Grid coordinates: { x: 5, y: 3 } (tiles from room origin)
 * - Pixel coordinates: { px: 640, py: 480 } (absolute world space)
 * 
 * @param {Object} npc - NPC data with position property
 * @param {Object} roomData - Room data for offset calculation
 * @returns {Object|null} {x, y} world coordinates or null if invalid
 */
export function calculateNPCWorldPosition(npc, roomData) {
    const position = npc.position;
    
    if (!position) {
        return null;
    }
    
    // Support pixel coordinates (absolute positioning)
    if (position.px !== undefined && position.py !== undefined) {
        return {
            x: position.px,
            y: position.py
        };
    }
    
    // Support grid coordinates (tile-based positioning)
    if (position.x !== undefined && position.y !== undefined) {
        // Room position is stored in roomData.position (from room loading system)
        const roomWorldX = roomData.position?.x ?? roomData.worldX ?? 0;
        const roomWorldY = roomData.position?.y ?? roomData.worldY ?? 0;
        
        return {
            x: roomWorldX + (position.x * TILE_SIZE),
            y: roomWorldY + (position.y * TILE_SIZE)
        };
    }
    
    return null;
}

/**
 * Setup Atlas-Based Animations (PixelLab format)
 * 
 * Creates animations from JSON atlas metadata with pre-defined animation frames.
 * Maps atlas animation keys to NPC animation keys for compatibility.
 *
 * @param {Phaser.Scene} scene - Phaser scene instance
 * @param {Phaser.Sprite} sprite - NPC sprite
 * @param {string} spriteSheet - Texture key (atlas)
 * @param {Object} config - Animation configuration
 * @param {string} npcId - NPC identifier for animation key naming
 */
function setupAtlasAnimations(scene, sprite, spriteSheet, config, npcId) {
    // Get atlas data from texture's customData (where Phaser stores it)
    const texture = scene.textures.get(spriteSheet);
    const atlasData = texture.customData;
    
    // If customData doesn't have animations, try to build from frame names
    if (!atlasData || !atlasData.animations) {
        console.log(`📝 Building animation data from frame names for ${spriteSheet}`);
        const frames = texture.getFrameNames();
        const animations = {};
        
        // Group frames by animation type and direction
        frames.forEach(frameName => {
            // Parse frame name: "breathing-idle_south_frame_000" -> animation: "breathing-idle_south"
            const match = frameName.match(/^(.+)_frame_\d+$/);
            if (match) {
                const animKey = match[1];
                if (!animations[animKey]) {
                    animations[animKey] = [];
                }
                animations[animKey].push(frameName);
            }
        });
        
        // Sort frames within each animation
        Object.keys(animations).forEach(key => {
            animations[key].sort();
        });
        
        // Store in customData for future use
        texture.customData = { animations };
        
        if (Object.keys(animations).length === 0) {
            console.warn(`⚠️ No animation data found in atlas: ${spriteSheet}`);
            return;
        }
    }
    
    const animations = texture.customData.animations;

    // Direction mapping: atlas directions → game directions
    const directionMap = {
        'east': 'right',
        'west': 'left',
        'north': 'up',
        'south': 'down',
        'north-east': 'up-right',
        'north-west': 'up-left',
        'south-east': 'down-right',
        'south-west': 'down-left'
    };

    // Animation type mapping: atlas animations → game animations
    const animTypeMap = {
        'breathing-idle': 'idle',
        'walk': 'walk',
        'cross-punch': 'attack',
        'lead-jab': 'jab',
        'falling-back-death': 'death',
        'taking-punch': 'hit',
        'pull-heavy-object': 'push'
    };

    // Create animations from atlas metadata
    for (const [atlasAnimKey, frames] of Object.entries(animations)) {
        // Parse animation key: "breathing-idle_east" → type: "breathing-idle", direction: "east"
        const parts = atlasAnimKey.split('_');
        const atlasDirection = parts[parts.length - 1]; // Last part is direction
        const atlasType = parts.slice(0, -1).join('_'); // Everything before last is type

        // Map to game direction and type
        const gameDirection = directionMap[atlasDirection] || atlasDirection;
        const gameType = animTypeMap[atlasType] || atlasType;

        // Create animation key
        const animKey = `npc-${npcId}-${gameType}-${gameDirection}`;

        if (!scene.anims.exists(animKey)) {
            // Use config frame rate, or default: 6 fps for idle (breathing), 10 fps for walk, 8 fps for others
            let frameRate = config[`${gameType}FrameRate`];
            if (!frameRate) {
                if (gameType === 'idle') frameRate = 6; // Slower for breathing effect
                else if (gameType === 'walk') frameRate = 10;
                else frameRate = 8;
            }
            
            scene.anims.create({
                key: animKey,
                frames: frames.map(frameName => ({ key: spriteSheet, frame: frameName })),
                frameRate: frameRate,
                repeat: gameType === 'idle' ? -1 : (gameType === 'walk' ? -1 : 0)
            });
            console.log(`  ✓ Created: ${animKey} (${frames.length} frames @ ${frameRate} fps)`);
        }
    }

    // Create legacy idle animation (default facing down) for backward compatibility
    const idleDownKey = `npc-${npcId}-idle`;
    const idleSouthKey = `npc-${npcId}-idle-down`;
    
    if (!scene.anims.exists(idleDownKey)) {
        if (scene.anims.exists(idleSouthKey)) {
            const sourceAnim = scene.anims.get(idleSouthKey);
            if (sourceAnim && sourceAnim.frames && sourceAnim.frames.length > 0) {
                // An animation's own frames can't be passed back to anims.create: Phaser
                // 3.60 reads {key, frame} and silently drops AnimationFrame objects
                scene.anims.create({
                    key: idleDownKey,
                    frames: sourceAnim.frames.map(f => ({ key: f.textureKey, frame: f.textureFrame })),
                    frameRate: sourceAnim.frameRate,
                    repeat: sourceAnim.repeat
                });
                console.log(`  ✓ Created legacy idle: ${idleDownKey} (${sourceAnim.frames.length} frames)`);
            } else {
                console.warn(`  ⚠️ Cannot create legacy idle: source animation ${idleSouthKey} has no frames`);
            }
        } else {
            console.warn(`  ⚠️ Cannot create legacy idle: ${idleSouthKey} not found`);
        }
    }

    console.log(`✅ Atlas animations setup complete for ${npcId}`);
}

/**
 * Set up animations for an NPC sprite
 *
 * Creates animation sequences based on sprite configuration.
 * Supports: idle (8 directions), walk (8 directions), greeting, and talking animations.
 *
 * @param {Phaser.Scene} scene - Phaser scene instance
 * @param {Phaser.Sprite} sprite - NPC sprite
 * @param {string} spriteSheet - Texture key
 * @param {Object} config - Animation configuration
 * @param {string} npcId - NPC identifier for animation key naming
 */
export function setupNPCAnimations(scene, sprite, spriteSheet, config, npcId) {
    console.log(`\n🎨 Setting up animations for NPC: ${npcId} (spriteSheet: ${spriteSheet})`);
    
    // Check if this is an atlas-based sprite (new PixelLab format)
    const texture = scene.textures.get(spriteSheet);
    const frames = texture ? texture.getFrameNames() : [];
    
    // More robust atlas detection
    let isAtlas = false;
    if (frames.length > 0) {
        const firstFrame = frames[0];
        isAtlas = typeof firstFrame === 'string' && 
                 (firstFrame.includes('breathing-idle') || 
                  firstFrame.includes('walk_') || 
                  firstFrame.includes('_frame_'));
    }
    
    console.log(`🔍 Animation setup for ${npcId}: ${frames.length} frames, first: "${frames[0]}", isAtlas: ${isAtlas}`);
    
    if (isAtlas) {
        console.log(`✨ Using atlas-based animations for ${npcId}`);
        setupAtlasAnimations(scene, sprite, spriteSheet, config, npcId);
        return;
    }
    
    // Otherwise use legacy frame-based animations
    console.log(`📜 Using legacy frame-based animations for ${npcId}`);
    const animPrefix = config.animPrefix || 'idle';

    // ===== IDLE ANIMATIONS (8 directions) =====
    // Idle animations for 5 base directions. There are deliberately no left keys:
    // npc-behavior.js plays the right-facing animation flipped when a left one is missing
    const idleAnimations = [
        { dir: 'right', frame: 0 },
        { dir: 'down', frame: 5 },
        { dir: 'up', frame: 10 },
        { dir: 'up-right', frame: 15 },
        { dir: 'down-right', frame: 20 }
    ];

    idleAnimations.forEach(anim => {
        const animKey = `npc-${npcId}-idle-${anim.dir}`;
        if (!scene.anims.exists(animKey)) {
            scene.anims.create({
                key: animKey,
                frames: [{ key: spriteSheet, frame: anim.frame }],
                frameRate: config.idleFrameRate || 4,
                repeat: -1
            });
        }
    });

    // Legacy idle animation (default facing down) for backward compatibility
    const idleStart = config.idleFrameStart || 20;
    const idleEnd = config.idleFrameEnd || 23;

    if (!scene.anims.exists(`npc-${npcId}-idle`)) {
        scene.anims.create({
            key: `npc-${npcId}-idle`,
            frames: scene.anims.generateFrameNumbers(spriteSheet, {
                start: idleStart,
                end: idleEnd
            }),
            frameRate: config.idleFrameRate || 4,
            repeat: -1
        });
    }

    // ===== WALK ANIMATIONS (8 directions) =====
    // Walk animations for 5 base directions (left uses right with flipX)
    // Frame layout (standard hacker spritesheet 64x64):
    //   Row 0 (right): frames 0-4
    //   Row 1 (down): frames 5-9
    //   Row 2 (up): frames 10-14
    //   Row 3 (up-right): frames 15-19
    //   Row 4 (down-right): frames 20-24
    const walkAnimations = [
        { dir: 'right', start: 1, end: 4 },
        { dir: 'down', start: 6, end: 9 },
        { dir: 'up', start: 11, end: 14 },
        { dir: 'up-right', start: 16, end: 19 },
        { dir: 'down-right', start: 21, end: 24 }
    ];

    walkAnimations.forEach(anim => {
        const animKey = `npc-${npcId}-walk-${anim.dir}`;
        if (!scene.anims.exists(animKey)) {
            const frames = scene.anims.generateFrameNumbers(spriteSheet, {
                start: anim.start,
                end: anim.end
            });
            console.log(`  📋 Walk ${anim.dir}: frames ${anim.start}-${anim.end}, generated ${frames.length} frames`);
            scene.anims.create({
                key: animKey,
                frames: frames,
                frameRate: 8,
                repeat: -1
            });
            console.log(`✅ Created walk animation: ${animKey}`);
        } else {
            console.log(`⚠️ Walk animation already exists: ${animKey}`);
        }
    });

    console.log(`📊 Walk animations summary for ${npcId}:`);
    ['right', 'down', 'up', 'up-right', 'down-right'].forEach(dir => {   // left = right, flipped
        const key = `npc-${npcId}-walk-${dir}`;
        console.log(`   ${dir}: ${scene.anims.exists(key) ? '✅' : '❌'} ${key}`);
    });

    // ===== OPTIONAL ANIMATIONS =====
    // Optional: Greeting animation (wave or nod)
    if (config.greetFrameStart !== undefined && config.greetFrameEnd !== undefined) {
        if (!scene.anims.exists(`npc-${npcId}-greet`)) {
            scene.anims.create({
                key: `npc-${npcId}-greet`,
                frames: scene.anims.generateFrameNumbers(spriteSheet, {
                    start: config.greetFrameStart,
                    end: config.greetFrameEnd
                }),
                frameRate: 8,
                repeat: 0
            });
        }
    }

    // Optional: Talking animation (subtle movement)
    if (config.talkFrameStart !== undefined && config.talkFrameEnd !== undefined) {
        if (!scene.anims.exists(`npc-${npcId}-talk`)) {
            scene.anims.create({
                key: `npc-${npcId}-talk`,
                frames: scene.anims.generateFrameNumbers(spriteSheet, {
                    start: config.talkFrameStart,
                    end: config.talkFrameEnd
                }),
                frameRate: 6,
                repeat: -1
            });
        }
    }

    console.log(`✅ Animation setup complete for ${npcId}\n`);
}

/**
 * Update NPC sprite depth based on Y position
 * 
 * Uses same system as player (feetY + 0.5) to ensure correct
 * perspective in top-down view. Accounts for sprite padding.
 * 
 * @param {Phaser.Sprite} sprite - NPC sprite to update
 */
export function updateNPCDepth(sprite) {
    if (!sprite || !sprite.body) return;
    
    // Get the bottom of the sprite, accounting for padding
    // Atlas sprites (80x80) have 16px padding at bottom, legacy sprites (64x64) have minimal padding
    // Use actual sprite.y so depth follows visual position (including during death animations)
    const spriteCenterToBottom = sprite.displayHeight / 2;
    const paddingOffset = sprite.isAtlas ? SPRITE_PADDING_BOTTOM_ATLAS : SPRITE_PADDING_BOTTOM_LEGACY;
    const spriteBottomY = sprite.y + spriteCenterToBottom - paddingOffset;
    
    // Set depth using standard formula
    const depth = spriteBottomY + 0.5; // World Y + sprite layer offset
    sprite.setDepth(depth);
}

/**
 * Process callback for NPC-player collision
 * Returns false to block collision if NPC is overlapping or would overlap a wall/table
 * 
 * @param {Phaser.Sprite} npcSprite - NPC sprite
 * @param {Phaser.Sprite} otherObject - Player sprite or chair object
 * @returns {boolean} True to allow collision, false to block it
 */
function shouldAllowNPCPush(npcSprite, otherObject) {
    if (!npcSprite.body || !otherObject.body) {
        return true;
    }
    
    // Get the room ID from the NPC's behavior (more reliable than player.currentRoom)
    const npcBehavior = window.npcBehaviorManager?.getBehavior(npcSprite.npcId);
    const roomId = npcBehavior?.roomId;
    
    if (!roomId) {
        return true;
    }
    
    const room = window.rooms?.[roomId];
    if (!room) {
        return true;
    }
    
    // Manually create NPC bounds instead of using getBounds() which can fail
    const npcBody = npcSprite.body;
    const npcBounds = new Phaser.Geom.Rectangle(
        npcBody.x,
        npcBody.y,
        npcBody.width,
        npcBody.height
    );
    
    // Check if NPC is currently overlapping any walls
    if (room.wallCollisionBoxes && room.wallCollisionBoxes.length > 0) {
        for (const wall of room.wallCollisionBoxes) {
            if (wall && wall.body) {
                try {
                    // Try using left/top/right/bottom if they exist (static bodies)
                    let wallBounds;
                    if ('left' in wall.body && 'top' in wall.body && 'right' in wall.body && 'bottom' in wall.body) {
                        wallBounds = new Phaser.Geom.Rectangle(
                            wall.body.left,
                            wall.body.top,
                            wall.body.right - wall.body.left,
                            wall.body.bottom - wall.body.top
                        );
                    } else {
                        wallBounds = new Phaser.Geom.Rectangle(
                            wall.body.x,
                            wall.body.y,
                            wall.body.width,
                            wall.body.height
                        );
                    }
                    
                    if (Phaser.Geom.Rectangle.Overlaps(npcBounds, wallBounds)) {
                        return false; // Already overlapping wall, don't allow push
                    }
                } catch (e) {
                    // Silently continue if one wall check fails
                }
            }
        }
    }
    
    // Check if NPC is overlapping any static objects (tables, etc.)
    if (room.objects) {
        const staticObjects = Object.values(room.objects).filter(obj => 
            obj && obj.body && (obj.body.immovable || obj.body.moves === false)
        );
        for (const obj of staticObjects) {
            try {
                const objBounds = new Phaser.Geom.Rectangle(
                    obj.body.x,
                    obj.body.y,
                    obj.body.width,
                    obj.body.height
                );
                if (Phaser.Geom.Rectangle.Overlaps(npcBounds, objBounds)) {
                    return false; // Already overlapping static object
                }
            } catch (e) {
                // Silently continue if one object check fails
            }
        }
    }
    
    return true; // Not overlapping obstacles, allow push
}

/**
 * Create collision between NPC sprite and player
 * 
 * Includes collision callback for patrolling NPCs to route around the player.
 * Uses process callback to prevent pushing NPCs through walls.
 * 
 * @param {Phaser.Scene} scene - Phaser scene instance
 * @param {Phaser.Sprite} npcSprite - NPC sprite
 * @param {Phaser.Sprite} player - Player sprite
 */
export function createNPCCollision(scene, npcSprite, player) {
    if (!npcSprite || !player) {
        console.warn('❌ Cannot create NPC collision: missing sprites');
        return;
    }
    
    try {
        // Add collider with both process callback (blocks push into walls) and collision callback
        // Process callback runs BEFORE separation - can prevent it
        // Collision callback runs AFTER separation - handles pathfinding
        scene.physics.add.collider(
            npcSprite, 
            player,
            () => {
                handleNPCPlayerCollision(npcSprite, player);
            },
            (npc, plyr) => {
                return shouldAllowNPCPush(npc, plyr);
            }
        );
        console.log(`✅ NPC collision created for ${npcSprite.npcId} (with wall-aware blocking)`);
    } catch (error) {
        console.error('❌ Error creating NPC collision:', error);
    }
}

/**
 * Play animation on NPC sprite
 * 
 * @param {Phaser.Sprite} sprite - NPC sprite
 * @param {string} animKey - Animation key to play
 * @returns {boolean} True if animation played, false if not found
 */
export function playNPCAnimation(sprite, animKey) {
    if (!sprite || !sprite.anims || !sprite.scene) {
        return false;
    }
    
    // Check if animation exists in the scene's animation manager
    if (sprite.scene.anims.exists(animKey)) {
        sprite.play(animKey);
        return true;
    }
    
    return false;
}

/**
 * Return NPC to idle animation
 * 
 * @param {Phaser.Sprite} sprite - NPC sprite
 * @param {string} npcId - NPC identifier
 */
export function returnNPCToIdle(sprite, npcId) {
    if (!sprite || !sprite.scene) return;
    
    const idleKey = `npc-${npcId}-idle`;
    // Check if animation exists in the scene's animation manager
    if (sprite.scene.anims.exists(idleKey)) {
        sprite.play(idleKey, true);
    }
}

/**
 * Destroy NPC sprite
 * 
 * @param {Phaser.Sprite} sprite - NPC sprite to destroy
 */
export function destroyNPCSprite(sprite) {
    if (sprite && !sprite.destroyed) {
        sprite.destroy();
    }
}

/**
 * Update all NPC depths in a collection
 * 
 * Call this if NPCs move, or after player sorts.
 * 
 * @param {Array} sprites - Array of NPC sprites
 */
export function updateNPCDepths(sprites) {
    if (!sprites || !Array.isArray(sprites)) return;
    
    sprites.forEach(sprite => {
        if (sprite && !sprite.destroyed) {
            updateNPCDepth(sprite);
        }
    });
}

/**
 * Set up wall collisions for an NPC sprite
 * 
 * Applies all wall collision boxes in the room to the NPC, similar to player.
 * 
 * @param {Phaser.Scene} scene - Phaser scene instance
 * @param {Phaser.Sprite} npcSprite - NPC sprite
 * @param {string} roomId - Room ID where NPC is located
 */
export function setupNPCWallCollisions(scene, npcSprite, roomId) {
    if (!npcSprite || !npcSprite.body) {
        return;
    }
    
    const game = scene || window.game;
    if (!game) {
        console.warn('❌ Cannot set up NPC wall collisions: no game reference');
        return;
    }
    
    const room = window.rooms ? window.rooms[roomId] : null;
    if (!room || !room.wallCollisionBoxes) {
        return;
    }
    
    // Add collision with all wall collision boxes in the room
    room.wallCollisionBoxes.forEach(wallBox => {
        if (wallBox.body) {
            game.physics.add.collider(npcSprite, wallBox);
        }
    });
    
    console.log(`✅ NPC wall collisions set up for ${npcSprite.npcId} in room ${roomId}`);
}

/**
 * Set up chair collisions for an NPC sprite
 * 
 * Applies all chair objects in the room to the NPC, similar to player.
 * Also includes chairs from all other rooms via window.chairs.
 * 
 * @param {Phaser.Scene} scene - Phaser scene instance
 * @param {Phaser.Sprite} npcSprite - NPC sprite
 * @param {string} roomId - Room ID where NPC is located
 */
export function setupNPCChairCollisions(scene, npcSprite, roomId) {
    if (!npcSprite || !npcSprite.body) {
        return;
    }
    
    const game = scene || window.game;
    if (!game) {
        console.warn('❌ Cannot set up NPC chair collisions: no game reference');
        return;
    }
    
    let chairsAdded = 0;
    
    // Collision with chairs from the current room (stored in room.objects)
    const room = window.rooms ? window.rooms[roomId] : null;
    if (room && room.objects) {
        Object.values(room.objects).forEach(obj => {
            if (obj && obj.body && obj.hasWheels) {
                // Add process callback to prevent chairs from pushing NPCs through walls
                game.physics.add.collider(
                    npcSprite, 
                    obj,
                    null, // no collision callback needed
                    (npc, chair) => {
                        return shouldAllowNPCPush(npc, chair);
                    }
                );
                chairsAdded++;
            }
        });
    }
    
    // Collision with all chairs from other rooms (global array includes chairs being initialized)
    if (window.chairs && Array.isArray(window.chairs)) {
        window.chairs.forEach(chair => {
            if (chair && chair.body && !chair._npcCollisionSetup) {
                // Avoid duplicate collisions - only collide if not already in current room
                if (!room || !room.objects || !room.objects[chair.objectId]) {
                    // Add process callback to prevent chairs from pushing NPCs through walls
                    game.physics.add.collider(
                        npcSprite, 
                        chair,
                        null, // no collision callback needed
                        (npc, chr) => {
                            return shouldAllowNPCPush(npc, chr);
                        }
                    );
                    chairsAdded++;
                }
            }
        });
    }
    
    console.log(`✅ NPC chair collisions set up for ${npcSprite.npcId}: added ${chairsAdded} chairs with wall-blocking`);
}

/**
 * Set up table collisions for an NPC sprite
 * 
 * Applies all table objects in the room to the NPC so they can't walk through tables.
 * 
 * @param {Phaser.Scene} scene - Phaser scene instance
 * @param {Phaser.Sprite} npcSprite - NPC sprite
 * @param {string} roomId - Room ID where NPC is located
 */
export function setupNPCTableCollisions(scene, npcSprite, roomId) {
    if (!npcSprite || !npcSprite.body) {
        return;
    }
    
    const game = scene || window.game;
    if (!game) {
        console.warn('❌ Cannot set up NPC table collisions: no game reference');
        return;
    }
    
    const room = window.rooms ? window.rooms[roomId] : null;
    if (!room || !room.objects) {
        return;
    }
    
    let tablesAdded = 0;
    
    // Collision with all table objects in the room
    Object.values(room.objects).forEach(obj => {
        // Tables are identified by scenarioData.type === 'table' or name includes 'desk'
        // Tables are static collision objects, so they should have a physics body
        if (obj && obj.body) {
            // Check if this looks like a table (has scenarioData.type === 'table' or name includes 'desk')
            const isTable = (obj.scenarioData && obj.scenarioData.type === 'table') || 
                           (obj.name && obj.name.toLowerCase().includes('desk'));
            
            if (isTable) {
                game.physics.add.collider(npcSprite, obj);
                tablesAdded++;
                console.log(`✅ Added NPC collision with table: ${obj.name}`);
            }
        }
    });
    
    if (tablesAdded > 0) {
        console.log(`✅ NPC table collisions set up for ${npcSprite.npcId}: added collisions with ${tablesAdded} tables`);
    }
}

/**
 * Set up all collisions for an NPC sprite (walls, tables, chairs, and other static objects)
 * 
 * Called when an NPC sprite is created to apply full collision setup.
 * 
 * @param {Phaser.Scene} scene - Phaser scene instance
 * @param {Phaser.Sprite} npcSprite - NPC sprite
 * @param {string} roomId - Room ID where NPC is located
 */
export function setupNPCEnvironmentCollisions(scene, npcSprite, roomId) {
    setupNPCWallCollisions(scene, npcSprite, roomId);
    setupNPCTableCollisions(scene, npcSprite, roomId);
    setupNPCChairCollisions(scene, npcSprite, roomId);
}

/**
 * Set up collisions between an NPC sprite and all other NPCs in the room
 * 
 * Called after creating each NPC sprite to enable NPC-to-NPC collision detection.
 * 
 * @param {Phaser.Scene} scene - Phaser scene instance
 * @param {Phaser.Sprite} npcSprite - NPC sprite to collide with others
 * @param {string} roomId - Room ID where NPC is located
 * @param {Array} allNPCSprites - Array of all NPC sprites in the room
 */
export function setupNPCToNPCCollisions(scene, npcSprite, roomId, allNPCSprites) {
    if (!npcSprite || !npcSprite.body) {
        return;
    }
    
    if (!allNPCSprites || !Array.isArray(allNPCSprites)) {
        return;
    }
    
    const game = scene || window.game;
    if (!game) {
        console.warn('❌ Cannot set up NPC-to-NPC collisions: no game reference');
        return;
    }
    
    // Add collision with all other NPCs
    let collisionsAdded = 0;
    allNPCSprites.forEach(otherNPC => {
        if (otherNPC && otherNPC !== npcSprite && otherNPC.body) {
            // Add collider with collision callback for avoidance
            game.physics.add.collider(
                npcSprite, 
                otherNPC,
                () => {
                    // Collision detected - handle NPC-to-NPC avoidance
                    handleNPCCollision(npcSprite, otherNPC);
                }
            );
            collisionsAdded++;
        }
    });
    
    if (collisionsAdded > 0) {
        console.log(`👥 NPC ${npcSprite.npcId}: ${collisionsAdded} NPC-to-NPC collision(s) set up with avoidance`);
    }
}

/**
 * Check if a position is safe for NPC movement (not blocked by walls/tables)
 * 
 * Uses raycasting to detect collisions with environment obstacles.
 * 
 * @param {Phaser.Sprite} sprite - NPC sprite to check
 * @param {number} testX - X position to test
 * @param {number} testY - Y position to test
 * @param {string} roomId - Room ID for collision context
 * @returns {boolean} True if position is safe, false if blocked
 */
function isPositionSafe(sprite, testX, testY, roomId) {
    if (!sprite || !sprite.body) return false;
    
    const room = window.rooms ? window.rooms[roomId] : null;
    if (!room) return false;
    
    // Get collision boundaries for this sprite
    const spriteWidth = sprite.body.width;
    const spriteHeight = sprite.body.height;
    const spriteOffsetX = sprite.body.offset.x;
    const spriteOffsetY = sprite.body.offset.y;
    
    // Calculate sprite bounds at test position
    const testBounds = {
        left: testX + spriteOffsetX,
        right: testX + spriteOffsetX + spriteWidth,
        top: testY + spriteOffsetY,
        bottom: testY + spriteOffsetY + spriteHeight
    };
    
    // Check collision with walls
    if (room.wallCollisionBoxes && Array.isArray(room.wallCollisionBoxes)) {
        for (const wallBox of room.wallCollisionBoxes) {
            if (wallBox && wallBox.body) {
                try {
                    const wallBounds = wallBox.body.getBounds();
                    if (wallBounds && boundsOverlap(testBounds, wallBounds)) {
                        return false;
                    }
                } catch (e) {
                    console.warn(`⚠️ Error getting wallBox bounds:`, e);
                }
            }
        }
    }
    
    // Check collision with tables
    if (room.objects) {
        for (const obj of Object.values(room.objects)) {
            if (obj && obj.body && obj.body.static) {
                // Check if this is a table
                const isTable = (obj.scenarioData && obj.scenarioData.type === 'table') || 
                               (obj.name && obj.name.toLowerCase().includes('desk'));
                
                if (isTable) {
                    try {
                        const objBounds = obj.body.getBounds();
                        if (objBounds && boundsOverlap(testBounds, objBounds)) {
                            return false;
                        }
                    } catch (e) {
                        console.warn(`⚠️ Error getting table bounds for ${obj.name}:`, e);
                    }
                }
            }
        }
    }
    
    return true;
}

/**
 * Check if two bounding rectangles overlap
 * 
 * @param {Object} bounds1 - {left, right, top, bottom}
 * @param {Object} bounds2 - {left, right, top, bottom} or Phaser Bounds object
 * @returns {boolean} True if bounds overlap
 */
function boundsOverlap(bounds1, bounds2) {
    if (!bounds1 || !bounds2) {
        return false;
    }
    
    // Handle Phaser Bounds object format
    const b2 = {
        left: bounds2.x !== undefined ? bounds2.x : bounds2.left,
        right: bounds2.x !== undefined ? bounds2.x + bounds2.width : bounds2.right,
        top: bounds2.y !== undefined ? bounds2.y : bounds2.top,
        bottom: bounds2.y !== undefined ? bounds2.y + bounds2.height : bounds2.bottom
    };
    
    return !(
        bounds1.right < b2.left ||
        bounds1.left > b2.right ||
        bounds1.bottom < b2.top ||
        bounds1.top > b2.bottom
    );
}

/**
 * Find safe collision avoidance position when NPC bumps into obstacle
 * 
 * DEPRECATED: No longer used. Collision handlers now use velocity-based movement.
 * Kept for reference/potential future use.
 * 
 * Tries multiple directions (NE, N, E, SE, etc.) to find safe space.
 * Falls back to smaller movements if needed.
 * 
 * @param {Phaser.Sprite} npcSprite - NPC sprite
 * @param {number} targetDistance - Distance to try moving (7px nominal)
 * @param {string} roomId - Room ID for collision checking
 * @returns {Object} {x, y, moved} - Safe position and whether position changed
 */
function findSafeCollisionPosition(npcSprite, targetDistance, roomId) {
    if (!npcSprite) {
        console.error('❌ findSafeCollisionPosition: npcSprite is undefined');
        return { x: 0, y: 0, moved: false, direction: 'error', distance: 0 };
    }

    const startX = npcSprite.x;
    const startY = npcSprite.y;
    
    // Try multiple directions in priority order (NE first, then clockwise)
    const directions = [
        { name: 'NE', dx: -1, dy: -1 },  // North-East (primary avoidance direction)
        { name: 'N',  dx:  0, dy: -1 },  // North
        { name: 'E',  dx:  1, dy:  0 },  // East
        { name: 'SE', dx:  1, dy:  1 },  // South-East
        { name: 'S',  dx:  0, dy:  1 },  // South
        { name: 'W',  dx: -1, dy:  0 },  // West
        { name: 'NW', dx: -1, dy:  1 },  // North-West (corrected: -x, +y)
        { name: 'SW', dx:  1, dy:  1 }   // South-West
    ];
    
    // Try decreasing distances (7px, 6px, 5px, etc.) to find safe position
    for (let distance = targetDistance; distance >= 3; distance--) {
        for (const dir of directions) {
            // Calculate movement (normalized by sqrt(2) for diagonals)
            const magnitude = Math.sqrt(dir.dx * dir.dx + dir.dy * dir.dy);
            const moveX = (dir.dx / magnitude) * distance;
            const moveY = (dir.dy / magnitude) * distance;
            
            const testX = startX + moveX;
            const testY = startY + moveY;
            
            if (isPositionSafe(npcSprite, testX, testY, roomId)) {
                console.log(`✅ Found safe ${dir.name} position at distance ${distance.toFixed(1)}px`);
                return { x: testX, y: testY, moved: true, direction: dir.name, distance };
            }
        }
    }
    
    // If no safe position found, return original position
    console.warn(`⚠️ Could not find safe collision avoidance position, staying in place`);
    return { x: startX, y: startY, moved: false, direction: 'blocked', distance: 0 };
}

/**
 * Check if an NPC can move in a given direction without hitting walls/tables
 * Uses raycasting in the direction of movement to detect obstacles
 * 
 * @param {Phaser.Sprite} npcSprite - NPC sprite to check
 * @param {number} velocityX - X component of velocity direction
 * @param {number} velocityY - Y component of velocity direction
 * @param {string} roomId - Room ID for collision checking
 * @param {boolean} ignoreNPCs - If true, only check walls/tables (ignore NPC blockers)
 * @returns {boolean} True if movement in this direction is safe
 */
function isDirectionSafe(npcSprite, velocityX, velocityY, roomId, ignoreNPCs) {
    if (!npcSprite || !roomId) return true; // Default to safe if can't validate
    
    const room = window.rooms?.[roomId];
    if (!room || !room.wallCollisionBoxes) return true;
    
    // Normalize velocity and calculate test position ahead
    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    if (speed === 0) return true;
    
    const normalizedX = velocityX / speed;
    const normalizedY = velocityY / speed;
    
    // Check position 10 pixels ahead in movement direction
    const testDistance = 10;
    const testX = npcSprite.x + normalizedX * testDistance;
    const testY = npcSprite.y + normalizedY * testDistance;
    
    // Check if test position collides with any walls/tables
    for (const wallBox of room.wallCollisionBoxes) {
        if (wallBox.body) {
            // Simple AABB overlap check
            const npcBounds = npcSprite.getBounds();
            const testBounds = new Phaser.Geom.Rectangle(
                testX - npcBounds.width / 2,
                testY - npcBounds.height / 2,
                npcBounds.width,
                npcBounds.height
            );
            const wallBounds = wallBox.getBounds();
            
            if (Phaser.Geom.Rectangle.Overlaps(testBounds, wallBounds)) {
                return false; // Direction blocked by wall/table
            }
        }
    }
    
    return true; // Direction is safe
}

/**
 * Handle NPC-to-NPC collision by inserting an avoidance waypoint
 * 
 * When two NPCs collide during wayfinding:
 * 1. Get NPC's current travel direction
 * 2. Create a temporary waypoint 10px to the right of that direction
 * 3. Insert it as the next waypoint (moving current target back)
 * 4. Recalculate path to new avoidance waypoint
 * 5. Physics handles separation naturally
 * 
 * This allows NPCs to intelligently route around each other rather than just bumping.
 * 
 * @param {Phaser.Sprite} npcSprite - NPC sprite that collided
 * @param {Phaser.Sprite} otherNPC - Other NPC sprite it collided with
 */
function handleNPCCollision(npcSprite, otherNPC) {
    if (!npcSprite || !otherNPC || npcSprite.destroyed || otherNPC.destroyed) {
        return;
    }

    // Get behavior instances for both NPCs
    const npcBehavior = window.npcBehaviorManager?.getBehavior(npcSprite.npcId);
    const otherBehavior = window.npcBehaviorManager?.getBehavior(otherNPC.npcId);

    if (!npcBehavior) {
        return;
    }

    // ALWAYS trigger settling on collision, regardless of patrol type
    // This prevents NPCs from being pushed across the room by pausing their behavior briefly
    const gameTime = npcSprite.scene?.time?.now || Date.now();
    npcBehavior.triggerSettling(gameTime);
    if (npcSprite.body) {
        npcSprite.body.setVelocity(0, 0);
    }

    // Only handle waypoint avoidance if NPC is in patrol or face_player mode with waypoints
    // (face_player is also a valid patrolling state, just with player-facing behavior)
    const isValidPatrolState = npcBehavior.currentState === 'patrol' || npcBehavior.currentState === 'face_player';
    if (!isValidPatrolState || !npcBehavior.patrolTarget || 
        !npcBehavior.config.patrol.waypoints || !Array.isArray(npcBehavior.config.patrol.waypoints) ||
        npcBehavior.config.patrol.waypoints.length === 0) {
        return;
    }

    // Get room context first - we need this for both collision checking and waypoint validation
    // Use npcBehavior's roomId which is always set, as fallback to window.player?.currentRoom
    const roomId = npcBehavior.roomId || window.player?.currentRoom;
    
    if (!roomId) {
        // Cannot validate collision safety without room context, skip this collision handling
        return;
    }

    // Apply velocity-based push for immediate separation
    // Note: We apply the push regardless of other NPCs (they're expected blockers),
    // but check against walls/tables only
    const pushDistance = 7; // pixels
    const neDiagonalX = -pushDistance / Math.sqrt(2); // NE direction: -x
    const neDiagonalY = -pushDistance / Math.sqrt(2); // NE direction: -y
    
    const velocityScale = 3; // Reduced from 10 to prevent excessive pushing
    let safeVelX = neDiagonalX * velocityScale;
    let safeVelY = neDiagonalY * velocityScale;
    
    // Only check against walls/tables, not other NPCs
    // (NPCs pushing against NPCs is expected behavior for collision response)
    if (!isDirectionSafe(npcSprite, safeVelX, safeVelY, roomId, true)) {
        // Try X component only
        if (isDirectionSafe(npcSprite, safeVelX, 0, roomId, true)) {
            safeVelY = 0;
        }
        // Try Y component only
        else if (isDirectionSafe(npcSprite, 0, safeVelY, roomId, true)) {
            safeVelX = 0;
        }
        // If both X and Y are blocked by walls, reduce magnitude but still push
        // (we still need to separate from the other NPC)
        else {
            // Reduce velocity but don't zero it - we need NPC separation
            safeVelX = safeVelX * 0.5;
            safeVelY = safeVelY * 0.5;
        }
    }
    
    // Don't apply manual velocity - let Phaser physics handle separation
    // Just trigger settling to pause patrol
    
    // Trigger settling state to pause patrol briefly while physics settles
    if (npcBehavior) {
        const gameTime = npcSprite.scene?.time?.now || Date.now();
        npcBehavior.triggerSettling(gameTime);
        // Ensure velocity is zero while settling
        if (npcSprite.body) {
            npcSprite.body.setVelocity(0, 0);
        }
    }

    // When NPCs collide, insert a temporary avoidance waypoint to the side
    // Then restore the original target so they continue their patrol
    if (npcBehavior && npcBehavior.config && npcBehavior.config.patrol &&
        npcBehavior.config.patrol.waypoints && Array.isArray(npcBehavior.config.patrol.waypoints) &&
        npcBehavior.config.patrol.waypoints.length > 0) {

        // Arrival-tolerance guard: if this NPC is doing a goToAndStay move and is
        // already close enough to its destination, stop here instead of inserting
        // an avoidance waypoint that would cause oscillation.
        if (npcBehavior._stopOnArrival && npcBehavior._goToStayDest) {
            const gdx = npcBehavior._goToStayDest.x - npcSprite.x;
            const gdy = npcBehavior._goToStayDest.y - npcSprite.y;
            if (gdx * gdx + gdy * gdy < (TILE_SIZE * 2) * (TILE_SIZE * 2)) {
                if (typeof npcBehavior._triggerGoToStayArrival === 'function') {
                    npcBehavior._triggerGoToStayArrival();
                }
                return;
            }
        }

        // Get the current travel direction
        const direction = npcBehavior.direction || 'down';

        // Map direction to perpendicular "right" vector (90° clockwise rotation)
        let rightVectorTilesX = 0, rightVectorTilesY = 0;
        switch (direction) {
            case 'right':   rightVectorTilesX = 0;    rightVectorTilesY = 1;   break;
            case 'down':    rightVectorTilesX = 1;    rightVectorTilesY = 0;   break;
            case 'left':    rightVectorTilesX = 0;    rightVectorTilesY = -1;  break;
            case 'up':      rightVectorTilesX = -1;   rightVectorTilesY = 0;   break;
            case 'down-right': rightVectorTilesX = 1; rightVectorTilesY = 1;   break;
            case 'down-left':  rightVectorTilesX = -1; rightVectorTilesY = 1;  break;
            case 'up-right':   rightVectorTilesX = 1;  rightVectorTilesY = -1; break;
            case 'up-left':    rightVectorTilesX = -1; rightVectorTilesY = -1; break;
            default:        rightVectorTilesX = 1;    rightVectorTilesY = 0;   break;
        }
        
        // Create temporary avoidance waypoint 1 tile to the right of travel direction
        const currentTileX = Math.round(npcSprite.x / TILE_SIZE);
        const currentTileY = Math.round(npcSprite.y / TILE_SIZE);
        const avoidTileX = currentTileX + rightVectorTilesX;
        const avoidTileY = currentTileY + rightVectorTilesY;
        
        // Validate coordinates
        if (typeof avoidTileX === 'number' && typeof avoidTileY === 'number' &&
            !isNaN(avoidTileX) && !isNaN(avoidTileY)) {
            
            const roomData = window.rooms?.[roomId];
            
            if (roomData) {
                const roomWorldX = roomData.position?.x ?? roomData.worldX ?? 0;
                const roomWorldY = roomData.position?.y ?? roomData.worldY ?? 0;
                
                // Check if avoidance waypoint is on walkable tile
                let isWalkable = true;
                if (window.npcPathfindingManager) {
                    const grid = window.npcPathfindingManager.getGrid(roomId);
                    if (grid && (avoidTileY < 0 || avoidTileY >= grid.length || 
                                 avoidTileX < 0 || avoidTileX >= grid[0].length ||
                                 grid[avoidTileY][avoidTileX] !== 0)) {
                        isWalkable = false;
                    }
                }
                
                if (isWalkable) {
                    const avoidanceWaypoint = {
                        tileX: avoidTileX,
                        tileY: avoidTileY,
                        worldX: roomWorldX + (avoidTileX * TILE_SIZE),
                        worldY: roomWorldY + (avoidTileY * TILE_SIZE),
                        isTemporary: true
                    };
                    
                    // Remove old temporary waypoint if exists
                    npcBehavior.config.patrol.waypoints = npcBehavior.config.patrol.waypoints.filter(wp => !wp.isTemporary);
                    
                    // Insert avoidance waypoint as next target (after current position in sequence)
                    const currentIndex = npcBehavior.waypointIndex || 0;
                    npcBehavior.config.patrol.waypoints.splice(currentIndex + 1, 0, avoidanceWaypoint);
                    
                    // Clear current path and force recalculation
                    npcBehavior.currentPath = [];
                    npcBehavior.patrolTarget = null;
                    npcBehavior._needsPathRecalc = true;
                    
                    console.log(`⬆️ [${npcSprite.npcId}] Bumped into ${otherNPC.npcId}, inserted avoidance waypoint at (${avoidTileX}, ${avoidTileY})`);
                    
                    // Immediately choose new waypoint (the avoidance waypoint)
                    if (typeof npcBehavior.chooseWaypointTarget === 'function') {
                        npcBehavior.chooseWaypointTarget(Date.now());
                    }
                }
            }
        }
    }
}

/**
 * Handle NPC-to-player collision by inserting an avoidance waypoint
 * 
 * When a patrolling NPC collides with the player:
 * 1. Get NPC's current travel direction
 * 2. Create a temporary waypoint 10px to the right of that direction
 * 3. Insert it as the next waypoint
 * 4. Recalculate path to new avoidance waypoint
 * 5. Physics handles separation naturally
 * 
 * Similar to NPC-to-NPC collision avoidance, allowing NPCs to navigate around the player.
 * 
 * @param {Phaser.Sprite} npcSprite - NPC sprite that collided with player
 * @param {Phaser.Sprite} player - Player sprite
 */
function handleNPCPlayerCollision(npcSprite, player) {
    if (!npcSprite || !player || npcSprite.destroyed || player.destroyed) {
        return;
    }

    // Don't handle collision if NPC is KO'd
    if (window.npcHostileSystem && window.npcHostileSystem.isNPCKO(npcSprite.npcId)) {
        return;
    }

    // Get behavior instance for NPC
    const npcBehavior = window.npcBehaviorManager?.getBehavior(npcSprite.npcId);

    if (!npcBehavior) {
        return;
    }

    // ALWAYS trigger settling on collision, regardless of patrol type
    // This prevents NPCs from being pushed across the room by pausing their behavior briefly
    const gameTime = npcSprite.scene?.time?.now || Date.now();
    npcBehavior.triggerSettling(gameTime);
    if (npcSprite.body) {
        npcSprite.body.setVelocity(0, 0);
    }

    // Only handle waypoint avoidance if NPC is in patrol or face_player mode with waypoints
    const isValidPatrolState = npcBehavior.currentState === 'patrol' || npcBehavior.currentState === 'face_player';
    if (!isValidPatrolState || !npcBehavior.patrolTarget || 
        !npcBehavior.config.patrol.waypoints || !Array.isArray(npcBehavior.config.patrol.waypoints) ||
        npcBehavior.config.patrol.waypoints.length === 0) {
        return;
    }

    // Get room context first - we need this for both collision checking and waypoint validation
    const roomId = window.player?.currentRoom;
    
    if (!roomId) {
        // Cannot validate collision safety without room context, skip this collision handling
        return;
    }

    // Apply velocity-based push for immediate separation
    // Note: We apply the push regardless of the player (expected blocker),
    // but check against walls/tables only
    const pushDistance = 7; // pixels
    const neDiagonalX = -pushDistance / Math.sqrt(2); // NE direction: -x
    const neDiagonalY = -pushDistance / Math.sqrt(2); // NE direction: -y
    
    const velocityScale = 3; // Reduced from 10 to prevent excessive pushing
    let safeVelX = neDiagonalX * velocityScale;
    let safeVelY = neDiagonalY * velocityScale;
    
    // Only check against walls/tables, not the player
    // (NPCs pushing against the player is expected behavior for collision response)
    if (!isDirectionSafe(npcSprite, safeVelX, safeVelY, roomId, true)) {
        // Try X component only
        if (isDirectionSafe(npcSprite, safeVelX, 0, roomId, true)) {
            safeVelY = 0;
        }
        // Try Y component only
        else if (isDirectionSafe(npcSprite, 0, safeVelY, roomId, true)) {
            safeVelX = 0;
        }
        // If both X and Y are blocked by walls, reduce magnitude but still push
        // (we still need to separate from the player)
        else {
            // Reduce velocity but don't zero it - we need player separation
            safeVelX = safeVelX * 0.5;
            safeVelY = safeVelY * 0.5;
        }
    }
    
    // Don't apply manual velocity - let Phaser physics handle separation
    // Just trigger settling to pause patrol
    
    // Trigger settling state to pause patrol briefly while physics settles
    if (npcBehavior) {
        const gameTime = npcSprite.scene?.time?.now || Date.now();
        npcBehavior.triggerSettling(gameTime);
        // Ensure velocity is zero while settling
        if (npcSprite.body) {
            npcSprite.body.setVelocity(0, 0);
        }
    }

    // When NPC collides with player, insert a temporary avoidance waypoint to the side
    // Then continue to original waypoint
    if (npcBehavior && npcBehavior.config && npcBehavior.config.patrol &&
        npcBehavior.config.patrol.waypoints && Array.isArray(npcBehavior.config.patrol.waypoints) &&
        npcBehavior.config.patrol.waypoints.length > 0) {

        // Arrival-tolerance guard: same as NPC-to-NPC collision — settle here if close enough.
        if (npcBehavior._stopOnArrival && npcBehavior._goToStayDest) {
            const gdx = npcBehavior._goToStayDest.x - npcSprite.x;
            const gdy = npcBehavior._goToStayDest.y - npcSprite.y;
            if (gdx * gdx + gdy * gdy < (TILE_SIZE * 2) * (TILE_SIZE * 2)) {
                if (typeof npcBehavior._triggerGoToStayArrival === 'function') {
                    npcBehavior._triggerGoToStayArrival();
                }
                return;
            }
        }

        // Get the current travel direction
        const direction = npcBehavior.direction || 'down';

        // Map direction to perpendicular "right" vector (90° clockwise rotation)
        let rightVectorTilesX = 0, rightVectorTilesY = 0;
        switch (direction) {
            case 'right':   rightVectorTilesX = 0;    rightVectorTilesY = 1;   break;
            case 'down':    rightVectorTilesX = 1;    rightVectorTilesY = 0;   break;
            case 'left':    rightVectorTilesX = 0;    rightVectorTilesY = -1;  break;
            case 'up':      rightVectorTilesX = -1;   rightVectorTilesY = 0;   break;
            case 'down-right': rightVectorTilesX = 1; rightVectorTilesY = 1;   break;
            case 'down-left':  rightVectorTilesX = -1; rightVectorTilesY = 1;  break;
            case 'up-right':   rightVectorTilesX = 1;  rightVectorTilesY = -1; break;
            case 'up-left':    rightVectorTilesX = -1; rightVectorTilesY = -1; break;
            default:        rightVectorTilesX = 1;    rightVectorTilesY = 0;   break;
        }
        
        // Create temporary avoidance waypoint 1 tile to the right of travel direction
        const currentTileX = Math.round(npcSprite.x / TILE_SIZE);
        const currentTileY = Math.round(npcSprite.y / TILE_SIZE);
        const avoidTileX = currentTileX + rightVectorTilesX;
        const avoidTileY = currentTileY + rightVectorTilesY;
        
        // Validate coordinates
        if (typeof avoidTileX === 'number' && typeof avoidTileY === 'number' &&
            !isNaN(avoidTileX) && !isNaN(avoidTileY)) {
            
            const roomData = window.rooms?.[roomId];
            if (roomData) {
                const roomWorldX = roomData.position?.x ?? roomData.worldX ?? 0;
                const roomWorldY = roomData.position?.y ?? roomData.worldY ?? 0;
                
                // Check if avoidance waypoint is on walkable tile
                let isWalkable = true;
                if (window.npcPathfindingManager) {
                    const grid = window.npcPathfindingManager.getGrid(roomId);
                    if (grid && (avoidTileY < 0 || avoidTileY >= grid.length || 
                                 avoidTileX < 0 || avoidTileX >= grid[0].length ||
                                 grid[avoidTileY][avoidTileX] !== 0)) {
                        isWalkable = false;
                    }
                }
                
                if (isWalkable) {
                    const avoidanceWaypoint = {
                        tileX: avoidTileX,
                        tileY: avoidTileY,
                        worldX: roomWorldX + (avoidTileX * TILE_SIZE),
                        worldY: roomWorldY + (avoidTileY * TILE_SIZE),
                        isTemporary: true
                    };
                    
                    // Remove old temporary waypoint if exists
                    npcBehavior.config.patrol.waypoints = npcBehavior.config.patrol.waypoints.filter(wp => !wp.isTemporary);
                    
                    // Insert avoidance waypoint as next target (after current position in sequence)
                    const currentIndex = npcBehavior.waypointIndex || 0;
                    npcBehavior.config.patrol.waypoints.splice(currentIndex + 1, 0, avoidanceWaypoint);
                    
                    // Clear current path and force recalculation
                    npcBehavior.currentPath = [];
                    npcBehavior.patrolTarget = null;
                    npcBehavior._needsPathRecalc = true;
                    
                    console.log(`⬆️ [${npcSprite.npcId}] Bumped into player, inserted avoidance waypoint at (${avoidTileX}, ${avoidTileY})`);
                    
                    // Immediately choose new waypoint (the avoidance waypoint)
                    if (typeof npcBehavior.chooseWaypointTarget === 'function') {
                        npcBehavior.chooseWaypointTarget(Date.now());
                    }
                }
            }
        }
    }
}

/**
 * Relocate NPC sprite to a new room
 * Called during multi-room route transitions
 * 
 * @param {Phaser.Sprite} sprite - NPC sprite to relocate
 * @param {string} fromRoomId - Current room ID
 * @param {string} toRoomId - Destination room ID
 * @param {string} npcId - NPC identifier
 */
export function relocateNPCSprite(sprite, fromRoomId, toRoomId, npcId) {
    try {
        if (!sprite || sprite.destroyed) {
            console.warn(`⚠️ Cannot relocate ${npcId}: sprite is invalid`);
            return;
        }

        const toRoomData = window.rooms?.[toRoomId];
        if (!toRoomData) {
            console.warn(`⚠️ Cannot relocate ${npcId}: destination room ${toRoomId} not loaded`);
            return;
        }

        // Find door connecting the two rooms
        const doorPos = findDoorBetweenRooms(fromRoomId, toRoomId);
        if (!doorPos) {
            console.warn(`⚠️ Cannot find door between ${fromRoomId} and ${toRoomId} for ${npcId}`);
            return;
        }

        // Position NPC at the door in the new room
        const toRoomPosition = toRoomData.position;
        const roomLocalX = doorPos.x - (window.rooms[fromRoomId]?.position?.x || 0);
        const roomLocalY = doorPos.y - (window.rooms[fromRoomId]?.position?.y || 0);

        const newX = toRoomPosition.x + roomLocalX;
        const newY = toRoomPosition.y + roomLocalY;

        console.log(`🚶 [${npcId}] Relocating sprite: (${sprite.x}, ${sprite.y}) → (${newX}, ${newY})`);

        // Update sprite position
        sprite.x = newX;
        sprite.y = newY;

        // Update depth for new room
        updateNPCDepth(sprite);

        console.log(`✅ [${npcId}] Sprite relocated to ${toRoomId}`);
    } catch (error) {
        console.error(`❌ Error relocating NPC ${npcId}:`, error);
    }
}

/**
 * Find door connecting two rooms
 * Returns the world position of the door connecting fromRoom to toRoom
 *
 * @param {string} fromRoomId - Source room ID
 * @param {string} toRoomId - Destination room ID
 * @returns {Object|null} Door position {x, y} in world coordinates or null
 */
function findDoorBetweenRooms(fromRoomId, toRoomId) {
    const fromRoom = window.rooms?.[fromRoomId];
    if (!fromRoom || !fromRoom.doorSprites) {
        return null;
    }

    // Find door sprite that connects to toRoomId
    const door = fromRoom.doorSprites.find(doorSprite => {
        // Check if this door leads to the destination room
        const doorData = doorSprite.doorData || {};
        const connectsTo = doorData.connectsToRoom || doorData.leadsTo;
        return connectsTo === toRoomId;
    });

    if (door) {
        return { x: door.x, y: door.y };
    }

    return null;
}

export default {
    createNPCSprite,
    calculateNPCWorldPosition,
    setupNPCAnimations,
    updateNPCDepth,
    createNPCCollision,
    setupNPCWallCollisions,
    setupNPCChairCollisions,
    setupNPCEnvironmentCollisions,
    setupNPCToNPCCollisions,
    playNPCAnimation,
    returnNPCToIdle,
    destroyNPCSprite,
    updateNPCDepths,
    relocateNPCSprite
};
