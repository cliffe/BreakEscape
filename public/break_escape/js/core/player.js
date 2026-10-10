// Player System
// Handles player creation, movement, and animation

// Player management system
import {
    MOVEMENT_SPEED,
    RUN_SPEED_MULTIPLIER,
    RUN_ANIMATION_MULTIPLIER,
    ARRIVAL_THRESHOLD,
    ROOM_CHECK_THRESHOLD,
    CLICK_INDICATOR_SIZE,
    CLICK_INDICATOR_DURATION,
    SPRITE_PADDING_BOTTOM_ATLAS
} from '../utils/constants.js';
import { ensureCharacterTexture } from '../systems/character-textures.js';
import { insertDoorwayWaypoints } from '../systems/path-doorways.js';

export let player = null;
export let targetPoint = null;
export let isMoving = false;
export let lastPlayerPosition = { x: 0, y: 0 };
let gameRef = null;

// Keyboard input state
const keyboardInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
    shift: false
};
let isKeyboardMoving = false;

// Keyboard pause state (for when minigames need keyboard input)
let keyboardPaused = false;

// Click-to-move pathfinding state
let playerPath = [];           // Array of world {x, y} waypoints from EasyStar pathfinding
let playerPathIndex = 0;       // Next waypoint index to head toward
let playerPathRequestId = 0;   // Incremented on each click to discard stale async callbacks

// Hold-to-walk state — when the player presses to move and keeps the button held,
// the character continuously walks toward the live cursor position (joystick-like)
// once the press has been held past HOLD_WALK_DELAY. A quick click still does a
// normal one-shot pathfinding move.
let holdWalkActive = false;
let holdWalkStartTime = 0;
const HOLD_WALK_DELAY = 250; // ms the press must be held before continuous-walk engages

// Footstep sound state
let footstepSound = null;
let footstepPlaying = false;

function updateFootstepSound(isPlayerMoving) {
    try {
        if (!window.game || !window.game.sound) return;
        if (isPlayerMoving) {
            if (!footstepPlaying) {
                if (!footstepSound) {
                    footstepSound = window.game.sound.get('footsteps') || window.game.sound.add('footsteps');
                }
                footstepSound.play({ loop: true, volume: 0.5 });
                footstepPlaying = true;
            }
        } else {
            if (footstepPlaying && footstepSound && footstepSound.isPlaying) {
                footstepSound.stop();
            }
            footstepPlaying = false;
        }
    } catch (e) {
        // Sound not available
    }
}
let playerFollowingPath = false; // True when actively following an EasyStar route (skip physics collision-stop)
let playerFinalGoal = null;    // Original click destination (world coords); cleared when we go direct or arrive
let waypointApproach = { target: null, distSq: Infinity }; // last frame's distance to targetPoint
let pathDebugGraphics = null;  // Phaser Graphics object used to draw the path overlay

/**
 * Returns the world position of the player's physics body centre (feet collider).
 * All pathfinding and movement comparisons should use this rather than player.x/y
 * (which is the sprite centre, not where the collision box sits).
 */
function playerBodyPos() {
    if (player?.body) {
        return { x: player.body.center.x, y: player.body.center.y };
    }
    return { x: player.x, y: player.y };
}

// Export functions to pause/resume keyboard interception
export function pauseKeyboardInput() {
    keyboardPaused = true;
    console.log('🔒 Keyboard input PAUSED for minigame (keyboardPaused = true)');
}

export function resumeKeyboardInput() {
    keyboardPaused = false;
    // Clear all keyboard state when resuming
    keyboardInput.up = false;
    keyboardInput.down = false;
    keyboardInput.left = false;
    keyboardInput.right = false;
    keyboardInput.space = false;
    keyboardInput.shift = false;
    isKeyboardMoving = false;
    console.log('🔓 Keyboard input RESUMED (keyboardPaused = false)');
}

/**
 * Update the player sprite to use a different character
 * This allows changing the player's appearance mid-game
 * @param {string} newSpriteKey - The texture key for the new sprite
 */
export async function updatePlayerSprite(newSpriteKey) {
    if (!player || !gameRef) {
        console.error('❌ Cannot update player sprite - player or game not initialized');
        return false;
    }
    
    console.log('🔄 Updating player sprite from', player.texture.key, 'to', newSpriteKey);
    
    // Load the atlas if this character isn't in use yet (only the scenario's are preloaded)
    if (!await ensureCharacterTexture(gameRef, newSpriteKey, { expected: true })) {
        console.error('❌ Failed to load new sprite:', newSpriteKey);
        return false;
    }
    
    // Store current state
    const currentDirection = player.direction || 'down';
    const wasMoving = player.isMoving;
    
    player.body.setSize(18, 10);
    player.body.setOffset(31, 66);
    
    // Update scenario reference BEFORE recreating animations so createPlayerAnimations() uses the new sprite
    if (window.gameScenario) {
        window.gameScenario.player = window.gameScenario.player || {};
        window.gameScenario.player.spriteSheet = newSpriteKey;
    }

    // Keep character registry in sync so person-chat portraits use the right talk image
    if (window.characterRegistry?.player) {
        const legacyTalkMap = { 'hacker': 'assets/characters/hacker-talk.png', 'hacker-red': 'assets/characters/hacker-red-talk.png' };
        window.characterRegistry.player.spriteSheet = newSpriteKey;
        window.characterRegistry.player.spriteTalk = legacyTalkMap[newSpriteKey] || `assets/characters/${newSpriteKey}_talk.png`;
    }
    
    // Destroy old animations before creating new ones (they reference the old sprite texture)
    const animKeysToDestroy = [
        'idle-down', 'idle-up', 'idle-left', 'idle-right',
        'idle-down-left', 'idle-down-right', 'idle-up-left', 'idle-up-right',
        'walk-down', 'walk-up', 'walk-left', 'walk-right',
        'walk-down-left', 'walk-down-right', 'walk-up-left', 'walk-up-right',
        'punch-down', 'punch-up', 'punch-left', 'punch-right'
    ];
    
    // Also destroy punch animations with compass directions
    const punchDirections = ['north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'];
    punchDirections.forEach(dir => {
        animKeysToDestroy.push(`cross-punch_${dir}`);
        animKeysToDestroy.push(`lead-jab_${dir}`);
    });
    
    animKeysToDestroy.forEach(key => {
        if (gameRef.anims.exists(key)) {
            gameRef.anims.remove(key);
        }
    });
    
    console.log('🗑️ Removed old animations');
    
    // Change the texture of the existing sprite
    const frames = gameRef.textures.get(newSpriteKey).getFrameNames();
    const breathingIdleFrames = frames.filter(f => f.startsWith('breathing-idle_south_frame_'));
    const initialFrame = breathingIdleFrames.length > 0 ? breathingIdleFrames[0] : frames[0];

    player.setTexture(newSpriteKey, initialFrame);
    
    // Recreate animations for the new sprite (now reads updated scenario)
    createPlayerAnimations();
    
    // Play appropriate animation
    const animKey = wasMoving ? `walk-${currentDirection}` : `idle-${currentDirection}`;
    // Check the global animation manager: player.anims.exists() only sees animations
    // local to the sprite, so it was always false and the player froze until they moved.
    // Play without ignoreIfPlaying: the sprite still holds the removed animation under
    // the same key, and that one's frames belong to the old texture.
    if (gameRef.anims.exists(animKey)) {
        player.anims.play(animKey);
    }
    
    console.log('✅ Player sprite updated successfully to', newSpriteKey);
    return true;
}

// Create player sprite
export function createPlayer(gameInstance) {
    gameRef = gameInstance;
    console.log('Creating player');
    
    // Get starting room position and calculate center
    const scenario = window.gameScenario;
    const startRoomId = scenario ? scenario.startRoom : 'reception';
    const startRoomPosition = getStartingRoomCenter(startRoomId);
    
    // Get player sprite - prioritize saved preference over scenario default
    const playerSprite = window.breakEscapeConfig?.playerSprite || window.gameScenario?.player?.spriteSheet || 'male_hacker_hood_v2';
    const hasExplicitSprite = !!(window.breakEscapeConfig?.playerSprite || window.gameScenario?.player?.spriteSheet);
    console.log(`🎮 Loading player sprite: ${playerSprite}`);

    // Update scenario to match saved preference (also initialises player object for scenarios that omit it)
    if (window.gameScenario && window.breakEscapeConfig?.playerSprite) {
        window.gameScenario.player = window.gameScenario.player || {};
        window.gameScenario.player.spriteSheet = window.breakEscapeConfig.playerSprite;
    }

    // Find initial frame (first breathing-idle_south frame)
    const texture = gameInstance.textures.get(playerSprite);
    const frames = texture ? texture.getFrameNames() : [];
    const breathingIdleFrames = frames.filter(f => f.startsWith('breathing-idle_south_frame_'));
    const initialFrame = breathingIdleFrames.length > 0 ? breathingIdleFrames[0] : frames[0];

    player = gameInstance.add.sprite(startRoomPosition.x, startRoomPosition.y, playerSprite, initialFrame);
    gameInstance.physics.add.existing(player);

    // Keep the character at original size
    player.setScale(1);

    // Collision box at feet (80x80 atlas sprites)
    player.body.setSize(18, 10);
    player.body.setOffset(31, 66);
    
    player.body.setCollideWorldBounds(true);
    player.body.setBounce(0);
    player.body.setDrag(0);
    player.body.setFriction(0);
    
    // Set initial player depth (will be updated dynamically during movement)
    updatePlayerDepth(startRoomPosition.x, startRoomPosition.y);
    
    // Track player direction and movement state
    player.direction = 'down'; // Initial direction
    player.isMoving = false;
    player.lastDirection = 'down';
    
    // Create animations
    createPlayerAnimations();
    
    // Set initial animation
    player.anims.play('idle-down', true);
    
    // Initialize last position
    lastPlayerPosition = { x: player.x, y: player.y };
    
    // Store player globally immediately for safety
    window.player = player;
    
    // Setup keyboard input listeners
    setupKeyboardInput();

    // If no sprite was configured, open character selection so the player can choose
    if (!hasExplicitSprite) {
        gameInstance.time.delayedCall(500, () => {
            const hud = window.gameHUD;
            if (hud && typeof hud.openPlayerPreferences === 'function') {
                hud.openPlayerPreferences();
            }
        });
    }

    return player;
}

function setupKeyboardInput() {
    // Handle keydown events
    document.addEventListener('keydown', (event) => {
        // Skip if keyboard input is paused (for minigames that need keyboard input)
        if (keyboardPaused) {
            console.log('⏸️ Keydown blocked (paused):', event.key);
            return;
        }
        
        const key = event.key.toLowerCase();
        
        // Shift key for running
        if (key === 'shift') {
            keyboardInput.shift = true;
            event.preventDefault();
            return;
        }
        
        // Spacebar for jump
        if (key === ' ') {
            keyboardInput.space = true;
            if (window.createPlayerJump) {
                window.createPlayerJump();
            }
            event.preventDefault();
            return;
        }
        
        // E key for interaction
        if (key === 'e') {
            // Check interaction mode - if in punch mode, just punch in current direction
            if (window.playerCombat) {
                const currentMode = window.playerCombat.getInteractionMode();
                if (currentMode === 'jab' || currentMode === 'cross') {
                    // Punch in current facing direction (don't interact)
                    window.playerCombat.punch();
                    if (window.getTutorialManager) window.getTutorialManager().notifyAttackedInCombatMode();
                    event.preventDefault();
                    return;
                }
            }
            
            // Normal interaction mode - interact with nearest object
            if (window.tryInteractWithNearest) {
                window.tryInteractWithNearest();
            }
            event.preventDefault();
            return;
        }
        
        // Arrow keys
        if (key === 'arrowup') {
            keyboardInput.up = true;
            isKeyboardMoving = true;
            event.preventDefault();
        } else if (key === 'arrowdown') {
            keyboardInput.down = true;
            isKeyboardMoving = true;
            event.preventDefault();
        } else if (key === 'arrowleft') {
            keyboardInput.left = true;
            isKeyboardMoving = true;
            event.preventDefault();
        } else if (key === 'arrowright') {
            keyboardInput.right = true;
            isKeyboardMoving = true;
            event.preventDefault();
        }
        
        // WASD keys
        if (key === 'w') {
            keyboardInput.up = true;
            isKeyboardMoving = true;
            event.preventDefault();
        } else if (key === 's') {
            keyboardInput.down = true;
            isKeyboardMoving = true;
            event.preventDefault();
        } else if (key === 'a') {
            keyboardInput.left = true;
            isKeyboardMoving = true;
            event.preventDefault();
        } else if (key === 'd') {
            keyboardInput.right = true;
            isKeyboardMoving = true;
            event.preventDefault();
        }
    });
    
    // Handle keyup events
    document.addEventListener('keyup', (event) => {
        // Skip if keyboard input is paused (for minigames that need keyboard input)
        if (keyboardPaused) {
            return;
        }
        
        const key = event.key.toLowerCase();
        
        // Shift key
        if (key === 'shift') {
            keyboardInput.shift = false;
            event.preventDefault();
            return;
        }
        
        // Spacebar
        if (key === ' ') {
            keyboardInput.space = false;
            event.preventDefault();
            return;
        }
        
        // Arrow keys
        if (key === 'arrowup') {
            keyboardInput.up = false;
            event.preventDefault();
        } else if (key === 'arrowdown') {
            keyboardInput.down = false;
            event.preventDefault();
        } else if (key === 'arrowleft') {
            keyboardInput.left = false;
            event.preventDefault();
        } else if (key === 'arrowright') {
            keyboardInput.right = false;
            event.preventDefault();
        }
        
        // WASD keys
        if (key === 'w') {
            keyboardInput.up = false;
            event.preventDefault();
        } else if (key === 's') {
            keyboardInput.down = false;
            event.preventDefault();
        } else if (key === 'a') {
            keyboardInput.left = false;
            event.preventDefault();
        } else if (key === 'd') {
            keyboardInput.right = false;
            event.preventDefault();
        }
        
        // Check if any keys are still pressed
        isKeyboardMoving = keyboardInput.up || keyboardInput.down || keyboardInput.left || keyboardInput.right;
    });
}

function getAnimationKey(direction) {
    // Check if player uses atlas-based animations (has native left directions)
    // For atlas sprites, all 8 directions exist natively
    const hasNativeLeft = gameRef?.anims?.exists(`idle-left`) || gameRef?.anims?.exists(`walk-left`);
    
    if (hasNativeLeft) {
        // Atlas sprite - use native directions
        return direction;
    }
    
    // Legacy sprite - map left directions to their right counterparts (sprite is flipped)
    switch(direction) {
        case 'left':
            return 'right';
        case 'down-left':
            return 'down-right';
        case 'up-left':
            return 'up-right';
        default:
            return direction;
    }
}

/**
 * Map player directions to compass directions for punch animations
 * @param {string} direction - Player direction (down, up, left, right, down-left, etc.)
 * @returns {string} - Compass direction (south, north, west, east, south-west, etc.)
 */
function mapPlayerDirectionToCompass(direction) {
    const directionMap = {
        'right': 'east',
        'left': 'west',
        'up': 'north',
        'down': 'south',
        'up-right': 'north-east',
        'up-left': 'north-west',
        'down-right': 'south-east',
        'down-left': 'south-west'
    };
    return directionMap[direction] || 'south';
}

function updateAnimationSpeed(isRunning) {
    // Update animation speed based on whether player is running
    if (!player || !player.anims) {
        return;
    }
    
    const frameRate = isRunning ? 8 * RUN_ANIMATION_MULTIPLIER : 8;
    
    // If there's a current animation playing, update its frameRate
    if (player.anims.currentAnim) {
        player.anims.currentAnim.frameRate = frameRate;
    }
}

function createPlayerAnimations() {
    const playerSprite = window.breakEscapeConfig?.playerSprite || window.gameScenario?.player?.spriteSheet || 'male_hacker_hood_v2';
    createAtlasPlayerAnimations(playerSprite);
}

function createAtlasPlayerAnimations(spriteSheet) {
    // Get texture and build animation data from frame names
    const texture = gameRef.textures.get(spriteSheet);
    const frameNames = texture.getFrameNames();
    
    // Build animations object from frame names
    const animations = {};
    frameNames.forEach(frameName => {
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
    
    if (Object.keys(animations).length === 0) {
        console.warn(`⚠️ No animation data found in atlas: ${spriteSheet}`);
        return;
    }

    // Get frame rates from player config
    const playerConfig = window.gameScenario?.player?.spriteConfig || {};
    const idleFrameRate = playerConfig.idleFrameRate || 6; // Slower for breathing effect
    const walkFrameRate = playerConfig.walkFrameRate || 10;
    const punchFrameRate = playerConfig.punchFrameRate || 12; // Faster for action animations

    // Direction mapping: atlas directions → player directions
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

    // Animation type mapping: atlas animations → player animations
    const animTypeMap = {
        'breathing-idle': 'idle',
        'walk': 'walk',
        'taking-punch': 'hit'
    };
    
    // Animation type framework (for grouping and frame rate)
    const animationFramework = {
        'idle': { frameRate: idleFrameRate, repeat: -1, name: 'idle' },
        'walk': { frameRate: walkFrameRate, repeat: -1, name: 'walk' },
        'cross-punch': { frameRate: punchFrameRate, repeat: 0, name: 'attack' },
        'lead-jab': { frameRate: punchFrameRate, repeat: 0, name: 'attack' },
        'taking-punch': { frameRate: 12, repeat: 0, name: 'hit' },
        'falling-back-death': { frameRate: 10, repeat: 0, name: 'death' }
    };

    // Create animations from atlas metadata
    for (const [atlasAnimKey, frames] of Object.entries(animations)) {
        // Parse animation key: "breathing-idle_east" → type: "breathing-idle", direction: "east"
        const parts = atlasAnimKey.split('_');
        const atlasDirection = parts[parts.length - 1];
        const atlasType = parts.slice(0, -1).join('_');

        // Map to player direction and type
        const playerDirection = directionMap[atlasDirection] || atlasDirection;
        const playerType = animTypeMap[atlasType] || atlasType;

        // Create animation key: "walk-right", "idle-down", "cross-punch_east", "lead-jab_south", etc.
        const animKey = playerType === 'idle' || playerType === 'walk' 
            ? `${playerType}-${playerDirection}` 
            : `${playerType}_${atlasDirection}`; // Keep atlas direction for punch animations
            
        // Debug for punch animations
        if (playerType === 'cross-punch' || playerType === 'lead-jab') {
            console.log(`  - Punch anim: ${atlasAnimKey} → type: ${playerType}, direction: ${atlasDirection}, key: ${animKey}, frames: ${frames.length}`);
        }

        // For idle animations, create a custom sequence: hold rotation frame for 2s, then loop breathing animation
        if (playerType === 'idle') {
            // Use the first frame of the rotation image (e.g., breathing-idle_{direction}_frame_000)
            const rotationFrame = frames[0];
            // Remaining frames are the breathing animation
            const breathFrames = frames.slice(1);
            // Build custom animation sequence
            const idleAnimFrames = [
                { key: spriteSheet, frame: rotationFrame, duration: 2000 }, // Hold for 2s
                ...breathFrames.map(frameName => ({ key: spriteSheet, frame: frameName, duration: 200 }))
            ];
            if (!gameRef.anims.exists(animKey)) {
                gameRef.anims.create({
                    key: animKey,
                    frames: idleAnimFrames,
                    frameRate: idleFrameRate,
                    repeat: -1
                });
                console.log(`  ✓ Created custom idle animation: ${animKey} (rotation + breath, ${idleAnimFrames.length} frames)`);
            }
        } else {
            // Standard animation (walk, cross-punch, lead-jab, etc.)
            const frameConfig = animationFramework[playerType] || { frameRate: walkFrameRate, repeat: -1 };
            if (!gameRef.anims.exists(animKey)) {
                const frameArray = frames.map(frameName => ({ key: spriteSheet, frame: frameName }));
                console.log(`  - Creating ${animKey} with ${frameArray.length} frames, frameRate: ${frameConfig.frameRate}, repeat: ${frameConfig.repeat}`);
                if (frameArray.length === 0) {
                    console.warn(`    ⚠️ Warning: Animation has 0 frames!`);
                }
                gameRef.anims.create({
                    key: animKey,
                    frames: frameArray,
                    frameRate: frameConfig.frameRate,
                    repeat: frameConfig.repeat
                });
                console.log(`  ✓ Created ${frameConfig.name} animation: ${animKey} (${frames.length} frames @ ${frameConfig.frameRate} fps, repeat: ${frameConfig.repeat})`);
            }
        }
    }

    console.log(`✅ Player atlas animations created for ${spriteSheet} (idle: ${idleFrameRate} fps, walk: ${walkFrameRate} fps, punch: ${punchFrameRate} fps)`);
    
    // Log all punch animations created
    const punchAnims = Object.keys(animations).filter(key => key.includes('cross-punch') || key.includes('lead-jab'));
    if (punchAnims.length > 0) {
        console.log(`🥊 Punch animations available (${punchAnims.length} total):`);
        punchAnims.forEach(animName => {
            const frameCount = animations[animName].length;
            console.log(`   - ${animName}: ${frameCount} frames`);
        });
    } else {
        console.warn('⚠️ No punch animations found in atlas!');
    }
}


/**
 * Draw a fading visual overlay showing the raw EasyStar path (grey nodes)
 * and the smoothed player path (cyan line + numbered circles).
 * Clears any previous overlay automatically.
 *
 * @param {number}   fromX     - player start world X
 * @param {number}   fromY     - player start world Y
 * @param {Array}    smoothed  - smoothed waypoints [{x,y},...]
 * @param {Array}    [raw]     - optional raw EasyStar waypoints for comparison
 */
function drawPathDebug(fromX, fromY, smoothed, raw) {
    // Destroy previous overlay
    if (pathDebugGraphics) {
        pathDebugGraphics.destroy();
        pathDebugGraphics = null;
    }
    if (!gameRef || !smoothed || smoothed.length === 0) return;

    const debugMode = !!window.breakEscapeDebug;
    const g = gameRef.add.graphics();
    g.setDepth(900); // above most objects, below UI
    pathDebugGraphics = g;

    const allPoints = [{ x: fromX, y: fromY }, ...smoothed];

    if (debugMode) {
        // ── FULL DEBUG VIEW ──────────────────────────────────────────────────
        // Raw path nodes (small grey circles)
        if (raw && raw.length > 0) {
            g.fillStyle(0x888888, 0.55);
            for (const p of raw) g.fillCircle(p.x, p.y, 3);
        }

        // Smoothed path — cyan line
        g.lineStyle(2, 0x00ffff, 0.9);
        g.beginPath();
        g.moveTo(allPoints[0].x, allPoints[0].y);
        for (let i = 1; i < allPoints.length; i++) g.lineTo(allPoints[i].x, allPoints[i].y);
        g.strokePath();

        // Waypoint circles + index labels
        for (let i = 0; i < smoothed.length; i++) {
            const p = smoothed[i];
            g.lineStyle(2, 0x00ffff, 1);
            g.fillStyle(0x003333, 0.7);
            g.fillCircle(p.x, p.y, 7);
            g.strokeCircle(p.x, p.y, 7);
            const label = gameRef.add.text(p.x + 9, p.y - 7, String(i + 1), {
                fontSize: '10px', color: '#00ffff', stroke: '#000000', strokeThickness: 2
            }).setDepth(901).setAlpha(0.9);
            if (!g._debugLabels) g._debugLabels = [];
            g._debugLabels.push(label);
        }

        // 3 s fade
        gameRef.tweens.add({
            targets: g,
            alpha: { from: 1, to: 0 },
            duration: 3000,
            ease: 'Linear',
            onUpdate: () => {
                if (g._debugLabels) for (const lbl of g._debugLabels) lbl.setAlpha(g.alpha);
            },
            onComplete: () => {
                if (g._debugLabels) for (const lbl of g._debugLabels) lbl.destroy();
                g.destroy();
                if (pathDebugGraphics === g) pathDebugGraphics = null;
            }
        });
    } else {
        // ── NORMAL VIEW — thin white line, same color/duration as click indicator ──
        g.lineStyle(1.5, 0xffffff, 0.6);
        g.beginPath();
        g.moveTo(allPoints[0].x, allPoints[0].y);
        for (let i = 1; i < allPoints.length; i++) g.lineTo(allPoints[i].x, allPoints[i].y);
        g.strokePath();

        // Match click-indicator fade duration (CLICK_INDICATOR_DURATION = 800 ms)
        gameRef.tweens.add({
            targets: g,
            alpha: { from: 0.7, to: 0 },
            duration: CLICK_INDICATOR_DURATION,
            ease: 'Sine.easeOut',
            onComplete: () => {
                g.destroy();
                if (pathDebugGraphics === g) pathDebugGraphics = null;
            }
        });
    }
}

export function movePlayerToPoint(x, y) {
    const worldBounds = gameRef.physics.world.bounds;

    // Ensure coordinates are within bounds
    x = Phaser.Math.Clamp(x, worldBounds.x, worldBounds.x + worldBounds.width);
    y = Phaser.Math.Clamp(y, worldBounds.y, worldBounds.y + worldBounds.height);

    // Create click indicator (kept so it can be relocated if we end up
    // navigating to a nearby reachable point instead of the exact click).
    const clickIndicator = createClickIndicator(x, y);

    // Reset path state and bump request ID to cancel any in-flight async callbacks
    playerPath = [];
    playerPathIndex = 0;
    const requestId = ++playerPathRequestId;

    const pathfindingManager = window.pathfindingManager;

    if (pathfindingManager && pathfindingManager.worldPathfinder) {
        // Use the body centre (feet collider) as the start position so all LOS
        // and pathfinding queries are relative to what actually collides with walls.
        const { x: px, y: py } = playerBodyPos();

        console.log(`🖱️ movePlayerToPoint: feet(${px.toFixed(0)},${py.toFixed(0)}) → target(${x.toFixed(0)},${y.toFixed(0)})`);

        // Prefer a direct route when the full width of the player body has clear
        // physics LOS to the destination (world-aware: checks all rooms' wall boxes).
        if (pathfindingManager.hasWorldPhysicsLineOfSight(px, py, x, y)) {
            console.log('  → Direct LOS clear — going straight');
            drawPathDebug(px, py, [{ x, y }], null);
            playerFollowingPath = false;
            playerFinalGoal = null;
            targetPoint = { x, y };
            isMoving = true;
        } else {
            // Snap destination to nearest walkable world-grid cell if the click
            // landed inside an obstacle — EasyStar cannot path to blocked cells.
            const snappedDest = pathfindingManager.findNearestWalkableWorldCell(x, y) || { x, y };
            if (snappedDest.x !== x || snappedDest.y !== y) {
                console.log(`  → Dest snapped from (${x.toFixed(0)},${y.toFixed(0)}) to (${snappedDest.x.toFixed(0)},${snappedDest.y.toFixed(0)})`);
            }
            console.log('  → LOS blocked — requesting EasyStar path...');

            // Apply a returned path: smooth it and start following. `goal` is the
            // point used for the LOS shortcut once on the last leg.
            const applyPath = (path, goal) => {
                const { x: cx, y: cy } = playerBodyPos();
                // Pin the centre line of every doorway the route passes through,
                // so the feet go through the opening square instead of clipping
                // its frame on a diagonal (path-doorways.js).
                path = insertDoorwayWaypoints({ x: cx, y: cy }, path, pathfindingManager.openDoorways);
                const smoothed = pathfindingManager.smoothWorldPathForPlayer(cx, cy, path);
                console.log(`  → Smoothed to ${smoothed.length} waypoints:`,
                    smoothed.map((p, i) => `[${i}](${p.x.toFixed(0)},${p.y.toFixed(0)})`).join(' → '));

                drawPathDebug(cx, cy, smoothed, path);

                playerFinalGoal = goal;
                playerPath = smoothed;
                playerPathIndex = 0;
                playerFollowingPath = true;
                targetPoint = playerPath[playerPathIndex++];
                isMoving = true;
            };

            // Route via the unified world grid (works across room boundaries)
            pathfindingManager.findWorldPath(px, py, snappedDest.x, snappedDest.y, (path) => {
                // Ignore if player has already clicked somewhere else
                if (requestId !== playerPathRequestId) return;

                if (path && path.length > 0) {
                    console.log(`  → EasyStar returned ${path.length} raw waypoints`);
                    applyPath(path, { x, y }); // original click for LOS shortcut
                    return;
                }

                // The click target sits in a region the player can't reach (e.g.
                // walled-off area). Instead of bee-lining, walk to the nearest cell
                // that is actually reachable from the player and path there.
                console.warn('  ⚠️ No path to target — finding nearest reachable cell');
                const reachable = pathfindingManager.findNearestReachableWorldCell(px, py, x, y);

                if (reachable) {
                    console.log(`  → Nearest reachable cell (${reachable.x.toFixed(0)},${reachable.y.toFixed(0)})`);
                    // Move the click effect to where we're actually navigating so the
                    // player understands their destination.
                    if (clickIndicator?.active) clickIndicator.setPosition(reachable.x, reachable.y);

                    pathfindingManager.findWorldPath(px, py, reachable.x, reachable.y, (path2) => {
                        if (requestId !== playerPathRequestId) return;
                        if (path2 && path2.length > 0) {
                            applyPath(path2, reachable);
                        } else {
                            // Should not happen (cell came from a flood-fill of the
                            // player's own component) — fall back to a direct move.
                            const { x: cx, y: cy } = playerBodyPos();
                            drawPathDebug(cx, cy, [reachable], null);
                            playerFollowingPath = false;
                            targetPoint = reachable;
                            isMoving = true;
                        }
                    }, true);
                } else {
                    console.warn('  ⚠️ No reachable cell found — falling back to snapped dest');
                    const { x: cx, y: cy } = playerBodyPos();
                    drawPathDebug(cx, cy, [snappedDest], null);
                    playerFollowingPath = false;
                    targetPoint = snappedDest;
                    isMoving = true;
                }
            }, true);
        }
    } else {
        // World grid not yet available — go direct
        playerFollowingPath = false;
        targetPoint = { x, y };
        isMoving = true;
    }

    // Notify tutorial of movement
    if (window.getTutorialManager) {
        const tutorialManager = window.getTutorialManager();
        tutorialManager.notifyPlayerMoved();
        tutorialManager.notifyPlayerClickedToMove();
    }
}

/**
 * Begin tracking a held press so that, once held past HOLD_WALK_DELAY, the player
 * continuously walks toward the live cursor position. Called from the pointerdown
 * handler when a plain click-to-move is issued.
 */
export function startHoldWalk() {
    holdWalkActive = true;
    holdWalkStartTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
}

/** Stop continuous hold-to-walk (called on pointer release). */
export function stopHoldWalk() {
    holdWalkActive = false;
}

/**
 * While the press is held past the delay, steer the player straight toward the
 * current cursor position. Returns true if hold-walk is currently driving movement.
 * Physics collisions naturally stop the player at walls (joystick-like control).
 */
function updateHoldWalk() {
    if (!holdWalkActive || !gameRef) return false;

    const pointer = gameRef.input.activePointer;
    // Safety: if the button was released without a pointerup event reaching us, stop.
    if (!pointer || !pointer.isDown) {
        holdWalkActive = false;
        return false;
    }

    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (now - holdWalkStartTime < HOLD_WALK_DELAY) return false; // still within click window

    // Take over from any in-flight pathfinding route and head straight for the cursor.
    const worldX = gameRef.cameras.main.scrollX + pointer.x;
    const worldY = gameRef.cameras.main.scrollY + pointer.y;
    playerPath = [];
    playerPathIndex = 0;
    playerFollowingPath = false;
    playerFinalGoal = null;
    ++playerPathRequestId; // discard any pending EasyStar callback from the initial click
    targetPoint = { x: worldX, y: worldY };
    isMoving = true;

    if (window.getTutorialManager) window.getTutorialManager().notifyPlayerUsedHoldWalk();
    return true;
}

// Exposed globally so teleport handlers (collision.js) can cancel in-flight paths
// without creating a circular import.
window.cancelClickToMove = () => {
    playerPath          = [];
    playerPathIndex     = 0;
    playerFollowingPath = false;
    playerFinalGoal     = null;
    ++playerPathRequestId; // invalidate any pending EasyStar callbacks
    isMoving            = false;
    targetPoint         = null;
    holdWalkActive      = false;
};

/**
 * Turn the player to face a world position, updating direction and idle animation.
 * Call this before triggering a click-based interaction so the player visually
 * faces the object/NPC they are acting on.
 */
export function facePlayerToward(targetX, targetY) {
    if (!player) return;

    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    let direction;
    if (absX > absY * 2) {
        direction = dx > 0 ? 'right' : 'left';
    } else if (absY > absX * 2) {
        direction = dy > 0 ? 'down' : 'up';
    } else {
        direction = dy > 0 ? (dx > 0 ? 'down-right' : 'down-left')
                           : (dx > 0 ? 'up-right' : 'up-left');
    }

    player.direction = direction;
    player.lastDirection = direction;

    // Play idle animation for the new direction (handles atlas vs legacy sprite mapping)
    const animDir = getAnimationKey(direction);
    const currentAnim = player.anims.currentAnim?.key || '';
    if (!currentAnim.includes('punch') && !currentAnim.includes('jab') &&
        !currentAnim.includes('death') && !currentAnim.includes('taking-punch')) {
        player.anims.play(`idle-${animDir}`, true);
    }
}

function updatePlayerDepth(x, y) {
    // Get the bottom of the player sprite, accounting for padding
    const spriteCenterToBottom = (player.height * player.scaleY) / 2;
    const paddingOffset = SPRITE_PADDING_BOTTOM_ATLAS;
    const playerBottomY = y + spriteCenterToBottom - paddingOffset;
    
    // Simple depth calculation: world Y position + layer offset
    const playerDepth = playerBottomY + 0.5; // World Y + sprite layer offset
    
    // Set the player depth (always update, no threshold)
    if (player) {
        player.setDepth(playerDepth);
        
        // Debug logging - only show when depth actually changes significantly
        const lastDepth = player.lastDepth || 0;
        if (Math.abs(playerDepth - lastDepth) > 25) { // Reduced threshold for finer granularity
            console.log(`Player depth: ${playerDepth} (Feet Y: ${playerBottomY}, Padding: ${paddingOffset}px)`);
            console.log(`  Player layers: feetY(${playerBottomY}) + 0.5`);
            player.lastDepth = playerDepth;
        }
    }
}

function createClickIndicator(x, y) {
    // Create a circle at the click position
    const indicator = gameRef.add.circle(x, y, CLICK_INDICATOR_SIZE, 0xffffff, 0.7);
    indicator.setDepth(1000); // Above ground but below player
    
    // Add a pulsing animation
    gameRef.tweens.add({
        targets: indicator,
        scale: { from: 0.5, to: 1.5 },
        alpha: { from: 0.7, to: 0 },
        duration: CLICK_INDICATOR_DURATION,
        ease: 'Sine.easeOut',
        onComplete: () => {
            indicator.destroy();
        }
    });

    return indicator;
}

export function updatePlayerMovement() {
    // Safety check: ensure player exists
    if (!player || !player.body) {
        return;
    }

    // Check if player is KO (knocked out) - disable movement
    if (window.playerHealth && window.playerHealth.isKO()) {
        player.body.setVelocity(0, 0);
        return;
    }

    // Check if movement is explicitly disabled
    if (player.disableMovement) {
        player.body.setVelocity(0, 0);
        return;
    }

    // Handle keyboard movement (takes priority over mouse movement)
    if (isKeyboardMoving) {
        updatePlayerKeyboardMovement();
    } else {
        // Handle mouse-based movement (original behavior)
        updatePlayerMouseMovement();
    }
    
    // Final check: if velocity is 0 and player is marked as moving, switch to idle
    if (player.body.velocity.x === 0 && player.body.velocity.y === 0 && player.isMoving) {
        player.isMoving = false;
        const animDir = getAnimationKey(player.direction);
        // Don't interrupt special animations: punch, death, hit, etc.
        const currentAnim = player.anims.currentAnim?.key || '';
        if (!currentAnim.includes('punch') && !currentAnim.includes('jab') &&
            !currentAnim.includes('death') && !currentAnim.includes('taking-punch')) {
            player.anims.play(`idle-${animDir}`, true);
        }
    }

    // Footstep sound: play while moving, stop when idle
    const actuallyMoving = player.body.velocity.x !== 0 || player.body.velocity.y !== 0;
    updateFootstepSound(actuallyMoving);
}

function updatePlayerKeyboardMovement() {
    // Cancel click-to-move (and any hold-to-walk) when keyboard input is detected
    if (isMoving || targetPoint) {
        isMoving = false;
        targetPoint = null;
        playerPath = [];
        playerPathIndex = 0;
        playerFollowingPath = false;
        playerFinalGoal = null;
        holdWalkActive = false;
    }
    
    // Calculate movement direction based on keyboard input
    let dirX = 0;
    let dirY = 0;
    
    if (keyboardInput.right) dirX += 1;
    if (keyboardInput.left) dirX -= 1;
    if (keyboardInput.down) dirY += 1;
    if (keyboardInput.up) dirY -= 1;
    
    // Normalize diagonal movement to maintain consistent speed
    let velocityX = 0;
    let velocityY = 0;
    
    if (dirX !== 0 || dirY !== 0) {
        const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
        // Apply run speed multiplier if shift is held
        const speed = keyboardInput.shift ? MOVEMENT_SPEED * RUN_SPEED_MULTIPLIER : MOVEMENT_SPEED;
        velocityX = (dirX / magnitude) * speed;
        velocityY = (dirY / magnitude) * speed;

        // Notify tutorial of movement and running
        if (window.getTutorialManager) {
            const tutorialManager = window.getTutorialManager();
            tutorialManager.notifyPlayerMoved();
            if (keyboardInput.shift) {
                tutorialManager.notifyPlayerRan();
            }
        }
    }
    
    // Update animation speed every frame while moving
    if (player.isMoving) {
        updateAnimationSpeed(keyboardInput.shift);
    }
    
    // Apply velocity
    player.body.setVelocity(velocityX, velocityY);
    
    // Update player depth based on actual player position
    updatePlayerDepth(player.x, player.y);
    
    // Update last player position for depth calculations
    lastPlayerPosition.x = player.x;
    lastPlayerPosition.y = player.y;
    
    // Determine direction based on velocity
    const absVX = Math.abs(velocityX);
    const absVY = Math.abs(velocityY);
    
    // Set player direction and animation
    if (velocityX === 0 && velocityY === 0) {
        // No movement - stop
        if (player.isMoving) {
            player.isMoving = false;
            const animDir = getAnimationKey(player.direction);
            player.anims.stop(); // Stop current animation
            // Don't interrupt special animations: punch, death, hit, etc.
            const currentAnim = player.anims.currentAnim?.key || '';
            if (!currentAnim.includes('punch') && !currentAnim.includes('jab') && 
                !currentAnim.includes('death') && !currentAnim.includes('taking-punch')) {
                player.anims.play(`idle-${animDir}`, true);
            }
        }
    } else if (absVX > absVY * 2) {
        // Mostly horizontal movement
        player.direction = velocityX > 0 ? 'right' : 'left';
        
        // Check if we have native left animations (atlas sprite)
        const hasNativeLeft = gameRef.anims.exists('walk-left');
        const animDir = hasNativeLeft ? player.direction : (velocityX > 0 ? 'right' : 'right');
        const shouldFlip = !hasNativeLeft && velocityX < 0;
        
        player.setFlipX(shouldFlip);
        
        if (!player.isMoving || player.lastDirection !== player.direction) {
            const currentAnim = player.anims.currentAnim?.key || '';
            
            // If punching, restart punch animation in new direction
            if (currentAnim.includes('punch') || currentAnim.includes('jab')) {
                const animType = currentAnim.includes('cross-punch') ? 'cross-punch' : 'lead-jab';
                const compassDir = mapPlayerDirectionToCompass(player.direction);
                const newPunchKey = `${animType}_${compassDir}`;
                
                if (gameRef.anims.exists(newPunchKey)) {
                    player.anims.play(newPunchKey, true);
                    console.log(`🥊 Direction changed during punch, restarting: ${newPunchKey}`);
                }
            } else {
                // Normal walk animation
                player.anims.play(`walk-${animDir}`, true);
            }
            player.isMoving = true;
            player.lastDirection = player.direction;
        }
    } else if (absVY > absVX * 2) {
        // Mostly vertical movement
        player.direction = velocityY > 0 ? 'down' : 'up';
        player.setFlipX(false);
        
        if (!player.isMoving || player.lastDirection !== player.direction) {
            const currentAnim = player.anims.currentAnim?.key || '';
            
            // If punching, restart punch animation in new direction
            if (currentAnim.includes('punch') || currentAnim.includes('jab')) {
                const animType = currentAnim.includes('cross-punch') ? 'cross-punch' : 'lead-jab';
                const compassDir = mapPlayerDirectionToCompass(player.direction);
                const newPunchKey = `${animType}_${compassDir}`;
                
                if (gameRef.anims.exists(newPunchKey)) {
                    player.anims.play(newPunchKey, true);
                    console.log(`🥊 Direction changed during punch, restarting: ${newPunchKey}`);
                }
            } else {
                // Normal walk animation
                player.anims.play(`walk-${player.direction}`, true);
            }
            player.isMoving = true;
            player.lastDirection = player.direction;
        }
    } else {
        // Diagonal movement
        if (velocityY > 0) {
            player.direction = velocityX > 0 ? 'down-right' : 'down-left';
        } else {
            player.direction = velocityX > 0 ? 'up-right' : 'up-left';
        }
        
        // Check if we have native left animations (atlas sprite)
        const hasNativeLeft = gameRef.anims.exists('walk-down-left') || gameRef.anims.exists('walk-up-left');
        const baseDir = hasNativeLeft ? player.direction : (velocityY > 0 ? 'down-right' : 'up-right');
        const shouldFlip = !hasNativeLeft && velocityX < 0;
        
        player.setFlipX(shouldFlip);
        
        if (!player.isMoving || player.lastDirection !== player.direction) {
            const currentAnim = player.anims.currentAnim?.key || '';
            
            // If punching, restart punch animation in new direction
            if (currentAnim.includes('punch') || currentAnim.includes('jab')) {
                const animType = currentAnim.includes('cross-punch') ? 'cross-punch' : 'lead-jab';
                const compassDir = mapPlayerDirectionToCompass(player.direction);
                const newPunchKey = `${animType}_${compassDir}`;
                
                if (gameRef.anims.exists(newPunchKey)) {
                    player.anims.play(newPunchKey, true);
                    console.log(`🥊 Direction changed during punch, restarting: ${newPunchKey}`);
                }
            } else {
                // Normal walk animation
                player.anims.play(`walk-${baseDir}`, true);
            }
            player.isMoving = true;
            player.lastDirection = player.direction;
        }
    }
}

function updatePlayerMouseMovement() {
    // If the press is being held, continuously retarget toward the live cursor.
    updateHoldWalk();

    if (!isMoving || !targetPoint) {
        if (player.body.velocity.x !== 0 || player.body.velocity.y !== 0) {
            player.body.setVelocity(0, 0);
            player.isMoving = false;
            
            // Play idle animation based on last direction
            // Don't interrupt special animations: punch, death, hit, etc.
            const currentAnim = player.anims.currentAnim?.key || '';
            if (!currentAnim.includes('punch') && !currentAnim.includes('jab') &&
                !currentAnim.includes('death') && !currentAnim.includes('taking-punch')) {
                player.anims.play(`idle-${player.direction}`, true);
            }
        }
        return;
    }

    // Update depth every frame based on sprite position so layering is correct
    // while the player walks along a click-to-move path.
    updatePlayerDepth(player.x, player.y);

    // Use the body centre (feet collider) as the reference position.
    // This matches what physically collides with walls, and is consistent with
    // how the click destination was recorded (player should put their feet on the target).
    const { x: px, y: py } = playerBodyPos();

    // --- Direct-path shortcut ---
    // While following a computed route, check every frame whether there is already
    // a clear physics LOS to the FINAL destination.  The moment there is, we ditch
    // the remaining waypoints and head straight there, giving smooth arrival.
    // ...unless a pinned doorway waypoint is still ahead: those must be walked
    // through, or the shortcut cuts the doorway corner the pin exists to avoid.
    const pinnedAhead = playerFollowingPath && (targetPoint?.pinned
        || playerPath.slice(playerPathIndex).some(p => p.pinned));
    if (playerFollowingPath && playerFinalGoal && !pinnedAhead) {
        const pm  = window.pathfindingManager;
        if (pm && pm.hasWorldPhysicsLineOfSight(px, py, playerFinalGoal.x, playerFinalGoal.y)) {
            targetPoint = playerFinalGoal;
            playerFinalGoal = null;
            playerPath = [];
            playerPathIndex = 0;
            playerFollowingPath = false;
            if (window.pathfindingDebug) console.log(`✂️ LOS shortcut to final goal (${targetPoint.x.toFixed(0)},${targetPoint.y.toFixed(0)})`);
        }
    }
    // Distance from feet to current waypoint / final target
    const dx = targetPoint.x - px;
    const dy = targetPoint.y - py;
    const distanceSq = dx * dx + dy * dy;

    // Reached current waypoint / final target.
    // An intermediate waypoint is a corner of the route, and only the straight
    // line FROM it was checked for clearance. Turning for the next one while
    // still ARRIVAL_THRESHOLD (8px, one grid cell) short of it cuts the corner
    // and catches the feet on whatever the corner was routing round. So:
    // pinned (doorway) waypoints must be reached within WAYPOINT_TIGHT, and any
    // other waypoint is left early only if the next one is clear from here.
    const WAYPOINT_TIGHT = 3;
    let arrived = distanceSq < ARRIVAL_THRESHOLD * ARRIVAL_THRESHOLD;
    // Only hold out for the tight radius while still closing in. Once the
    // player stops getting closer (a big frame step overshooting it, or the
    // body touching something) move on as before, so it can never jitter
    // round a point or push at one it can't reach.
    const closing = waypointApproach.target !== targetPoint || distanceSq < waypointApproach.distSq;
    waypointApproach = { target: targetPoint, distSq: distanceSq };
    if (arrived && playerFollowingPath && playerPathIndex < playerPath.length
        && distanceSq >= WAYPOINT_TIGHT * WAYPOINT_TIGHT && closing && player.body.blocked.none) {
        const next = playerPath[playerPathIndex];
        const pm = window.pathfindingManager;
        if (targetPoint.pinned) {
            arrived = false;
        } else if (pm && !pm.hasWorldPhysicsLineOfSight(px, py, next.x, next.y)) {
            arrived = false;
        }
    }
    if (arrived) {
        // If there are more path waypoints, advance to the next one without stopping
        if (playerPathIndex < playerPath.length) {
            targetPoint = playerPath[playerPathIndex++];
            return;
        }

        // All waypoints exhausted — stop at the final destination
        isMoving = false;
        playerPath = [];
        playerPathIndex = 0;
        playerFollowingPath = false;
        playerFinalGoal = null;
        player.body.setVelocity(0, 0);
        if (player.isMoving) {
            player.isMoving = false;
            const animDir = getAnimationKey(player.direction);
            player.anims.stop(); // Stop current animation
            // Don't interrupt special animations: punch, death, hit, etc.
            const currentAnim = player.anims.currentAnim?.key || '';
            if (!currentAnim.includes('punch') && !currentAnim.includes('jab') &&
                !currentAnim.includes('death') && !currentAnim.includes('taking-punch')) {
                player.anims.play(`idle-${animDir}`, true);
            }
        }
        return;
    }

    // Update last player position for depth calculations
    lastPlayerPosition.x = player.x;
    lastPlayerPosition.y = player.y;

    // Normalize movement vector for consistent speed
    const distance = Math.sqrt(distanceSq);
    const velocityX = (dx / distance) * MOVEMENT_SPEED;
    const velocityY = (dy / distance) * MOVEMENT_SPEED;

    // Set velocity directly without checking for changes
    player.body.setVelocity(velocityX, velocityY);
    
    // Determine direction based on velocity
    const absVX = Math.abs(velocityX);
    const absVY = Math.abs(velocityY);
    
    // Check if we have native left animations (atlas sprite)
    const hasNativeLeft = gameRef.anims.exists('walk-left') || gameRef.anims.exists('walk-down-left');
    
    // Set player direction and animation
    if (absVX > absVY * 2) {
        // Mostly horizontal movement
        player.direction = velocityX > 0 ? 'right' : (hasNativeLeft ? 'left' : 'right');
        player.setFlipX(!hasNativeLeft && velocityX < 0);
    } else if (absVY > absVX * 2) {
        // Mostly vertical movement
        player.direction = velocityY > 0 ? 'down' : 'up';
        player.setFlipX(false);
    } else {
        // Diagonal movement
        if (velocityY > 0) {
            player.direction = velocityX > 0 ? 'down-right' : (hasNativeLeft ? 'down-left' : 'down-right');
        } else {
            player.direction = velocityX > 0 ? 'up-right' : (hasNativeLeft ? 'up-left' : 'up-right');
        }
        player.setFlipX(!hasNativeLeft && velocityX < 0);
    }
    
    // Play appropriate animation if not already playing
    if (!player.isMoving || player.lastDirection !== player.direction) {
        const currentAnim = player.anims.currentAnim?.key || '';
        
        // If punching, restart punch animation in new direction
        if (currentAnim.includes('punch') || currentAnim.includes('jab')) {
            const animType = currentAnim.includes('cross-punch') ? 'cross-punch' : 'lead-jab';
            const compassDir = mapPlayerDirectionToCompass(player.direction);
            const newPunchKey = `${animType}_${compassDir}`;
            
            if (gameRef.anims.exists(newPunchKey)) {
                player.anims.play(newPunchKey, true);
                console.log(`🥊 Mouse movement: direction changed during punch, restarting: ${newPunchKey}`);
            }
        } else {
            // Normal walk animation
            player.anims.play(`walk-${player.direction}`, true);
        }
        player.isMoving = true;
        player.lastDirection = player.direction;
    }

    // Stop if collision detected — but only for straight-line (non-pathfinded) movement.
    // When following a computed route, trust the waypoints to navigate around obstacles;
    // stopping here would cancel a valid path just from grazing a tile corner.
    // Skip while hold-to-walk is active: the player is steering into the obstacle on
    // purpose, so cancelling movement here would just be re-engaged next frame,
    // flickering between walk and idle animations. Physics already holds them at the wall.
    if (!playerFollowingPath && !holdWalkActive && player.body.blocked.none === false) {
        isMoving = false;
        playerPath = [];
        playerPathIndex = 0;
        playerFollowingPath = false;
        playerFinalGoal = null;
        player.body.setVelocity(0, 0);
        player.isMoving = false;
        
        // Switch walk animations to idle, but preserve special animations
        const currentAnim = player.anims.currentAnim?.key || '';
        if (currentAnim.includes('walk')) {
            const animDir = getAnimationKey(player.direction);
            player.anims.play(`idle-${animDir}`, true);
        }
    }
}

function getStartingRoomCenter(startRoomId) {
    // Default position if rooms not initialized yet
    const defaultPos = { x: 160, y: 144 };
    
    // If rooms are available, get the actual room position
    if (window.rooms && window.rooms[startRoomId]) {
        const roomPos = window.rooms[startRoomId].position;
        // Center of 320x288 room
        return {
            x: roomPos.x + 160,
            y: roomPos.y + 144
        };
    }
    
    // Fallback to reasonable center position for reception room
    // Reception is typically at (0,0) so center would be (160, 144)
    return defaultPos;
}

// Export for global access
window.createPlayer = createPlayer;
window.pauseKeyboardInput = pauseKeyboardInput;
window.resumeKeyboardInput = resumeKeyboardInput;
window.updatePlayerSprite = updatePlayerSprite;

console.log('✅ Player module loaded - keyboard control functions exported to window:', {
    createPlayer: typeof window.createPlayer,
    pauseKeyboardInput: typeof window.pauseKeyboardInput,
    resumeKeyboardInput: typeof window.resumeKeyboardInput,
    updatePlayerSprite: typeof window.updatePlayerSprite
}); 