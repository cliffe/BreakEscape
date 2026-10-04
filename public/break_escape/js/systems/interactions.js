// Object interaction system
import { INTERACTION_RANGE, INTERACTION_RANGE_SQ, INTERACTION_CHECK_INTERVAL, DOOR_INTERACTION_RANGE_SQ } from '../utils/constants.js';
// IMPORTANT: version must match all other imports of rooms.js — mismatched ?v= strings
// create separate module instances with separate rooms objects, causing state to diverge.
import { rooms } from '../core/rooms.js';
import { facePlayerToward } from '../core/player.js';
import { handleUnlock } from './unlock-system.js';
import { handleDoorInteraction } from './doors.js';
import { collectFingerprint, handleBiometricScan } from './biometrics.js';
import { addToInventory, createItemIdentifier } from './inventory.js';
import { playUISound, playGameSound } from './ui-sounds.js';
import { applyActions } from './apply-actions.js';
import { resolveObjectField } from '../utils/conditional-text.js';
import { npcReachDistSq } from './npc-reach.js';
import { shouldExamine, startExamine } from './examine.js';

let gameRef = null;

export function setGameInstance(gameInstance) {
    gameRef = gameInstance;

    // Immediately destroy any proximity ghost when an item is collected,
    // regardless of whether the interaction check interval has fired yet.
    if (window.eventDispatcher) {
        window.eventDispatcher.on('item_removed_from_scene', ({ sprite }) => {
            if (sprite) removeProximityGhost(sprite);
        });

        // Listen for remote object unlocks (e.g., when archive decryption flag is submitted)
        window.eventDispatcher.on('object_remotely_unlocked', ({ objectId }) => {
            let found = false;
            Object.values(rooms).forEach(room => {
                // room.objects is a map keyed by objectId (rooms.js:1736 declares
                // it {}, rooms.js:437 fills it), not an array -- so the array
                // default here threw TypeError on every remote unlock and the
                // handler never reached the object. That is why a flag-submission
                // unlock silently did nothing.
                Object.values(room.objects || {}).forEach(obj => {
                    if (obj.scenarioData?.id === objectId || obj.objectId === objectId) {
                        obj.scenarioData.locked = false;
                        if (obj.lockOverlay) obj.lockOverlay.setVisible(false);
                        console.log('[RemoteUnlock] Object unlocked:', objectId);
                        found = true;
                    }
                });
            });
            if (!found) {
                console.warn('[RemoteUnlock] Object not found in loaded rooms:', objectId);
            }
        });

        // Bridge sudo_flag_submitted → global variable + global_variable_changed event.
        // The flag-station emit_event reward fires the raw event; without an Ink terminal, we must
        // set the global variable here so Ink conditions (e.g. phone debrief gate) still work.
        window.eventDispatcher.on('sudo_flag_submitted', () => {
            if (window.gameState?.globalVariables) {
                window.gameState.globalVariables.sudo_flag_submitted = true;
                window.eventDispatcher.emit('global_variable_changed:sudo_flag_submitted', {
                    name: 'sudo_flag_submitted', value: true
                });
            }
        });
    }
}

// Helper function to calculate interaction distance with direction-based offset
// Extends reach from the edge of the player sprite in the direction the player is facing
function getInteractionDistance(playerSprite, targetX, targetY) {
    const playerDirection = playerSprite.direction || 'down';
    const SPRITE_HALF_WIDTH = 32; // 64px sprite / 2
    const SPRITE_HALF_HEIGHT = 32; // 64px sprite / 2
    const SPRITE_QUARTER_WIDTH = 16; // 64px sprite / 4 (for right/left)
    const SPRITE_QUARTER_HEIGHT = 16; // 64px sprite / 4 (for down)
    
    // Calculate offset point based on player direction
    let offsetX = 0;
    let offsetY = 0;
    
    switch(playerDirection) {
        case 'up':
            offsetY = -SPRITE_HALF_HEIGHT;
            break;
        case 'down':
            offsetY = SPRITE_QUARTER_HEIGHT;
            break;
        case 'left':
            offsetX = -SPRITE_QUARTER_WIDTH;
            break;
        case 'right':
            offsetX = SPRITE_QUARTER_WIDTH;
            break;
        case 'up-left':
            offsetX = -SPRITE_HALF_WIDTH;
            offsetY = -SPRITE_HALF_HEIGHT;
            break;
        case 'up-right':
            offsetX = SPRITE_HALF_WIDTH;
            offsetY = -SPRITE_HALF_HEIGHT;
            break;
        case 'down-left':
            offsetX = -SPRITE_QUARTER_WIDTH;
            offsetY = SPRITE_QUARTER_HEIGHT;
            break;
        case 'down-right':
            offsetX = SPRITE_QUARTER_WIDTH;
            offsetY = SPRITE_QUARTER_HEIGHT;
            break;
    }
    
    // Measure from the offset point (edge of player sprite in facing direction)
    const measureX = playerSprite.x + offsetX;
    const measureY = playerSprite.y + offsetY;
    
    const dx = targetX - measureX;
    const dy = targetY - measureY;
    const offsetDistSq = dx * dx + dy * dy;

    // The offset exists to EXTEND reach in the facing direction. For a target
    // only a few px away it did the opposite: the measure point sails past the
    // target, so the distance grows as the player closes in, and an object the
    // player is practically standing on is refused. Worst case is the
    // up-diagonals, whose offset is 45px — approach from just below and a
    // target 8px away measures 38px, over the 32px limit.
    //
    // Taking the smaller of the offset and plain centre distances keeps the
    // extended reach while making the check monotonic (never refuses something
    // for being too close). This cannot widen what is reachable overall:
    // every caller — tryInteractWithNearest() and isObjectInInteractionRange()
    // on the click paths — already gates candidates on the plain centre
    // distance first, so this only stops the second check contradicting the
    // first. Same candidates, minus the silent refusals.
    const pdx = targetX - playerSprite.x;
    const pdy = targetY - playerSprite.y;
    const plainDistSq = pdx * pdx + pdy * pdy;

    return Math.min(offsetDistSq, plainDistSq); // squared, for performance
}

// Update NPC talk icon positions every frame (even when not checking interactions)
function updateNPCTalkIcons() {
    // Iterate through all rooms and update icon positions for visible icons
    Object.values(rooms).forEach(room => {
        if (room.npcSprites) {
            room.npcSprites.forEach(sprite => {
                const iconX = Math.round(sprite.x + 5);
                const iconY = Math.round(sprite.y - 38);

                if (sprite.interactionIndicator && sprite.interactionIndicator.visible) {
                    sprite.interactionIndicator.setPosition(iconX, iconY);
                }

                // Also keep the bark-pulse icon tracking the NPC while it's visible
                if (sprite.barkIcon && sprite.barkIcon.visible) {
                    sprite.barkIcon.setPosition(iconX, iconY);
                }
            });
        }
    });
}

export function checkObjectInteractions() {
    // Update NPC talk icons every frame to follow moving NPCs
    updateNPCTalkIcons();
    
    // Skip if not enough time has passed since last check
    const currentTime = performance.now();
    if (this.lastInteractionCheck && 
        currentTime - this.lastInteractionCheck < INTERACTION_CHECK_INTERVAL) {
        return;
    }
    this.lastInteractionCheck = currentTime;

    const player = window.player;
    if (!player) {
        return; // Player not created yet
    }

    // We'll measure distance from the closest edge of the player sprite
    const px = player.x;
    const py = player.y;
    
    // Get viewport bounds for performance optimization
    const camera = gameRef ? gameRef.cameras.main : null;
    const margin = INTERACTION_RANGE * 2; // Larger margin to catch more objects
    const viewBounds = camera ? {
        left: camera.scrollX - margin,
        right: camera.scrollX + camera.width + margin,
        top: camera.scrollY - margin,
        bottom: camera.scrollY + camera.height + margin
    } : null;

    // Check ALL objects in ALL rooms, not just current room
    Object.entries(rooms).forEach(([roomId, room]) => {
        if (!room.objects) return;
        
        Object.values(room.objects).forEach(obj => {
            // Skip inactive objects (e.g. collected into inventory)
            if (!obj.active) {
                // Clean up any lingering ghost left from when the item was in range
                removeProximityGhost(obj);
                return;
            }
            
            // Skip non-interactable objects (only highlight scenario items)
            if (!obj.interactable) {
                // Clear highlight if object was previously highlighted
                if (obj.isHighlighted) {
                    obj.isHighlighted = false;
                    obj.clearTint();
                    removeProximityGhost(obj);
                    // Clean up interaction sprite if exists
                    if (obj.interactionIndicator) {
                        obj.interactionIndicator.destroy();
                        delete obj.interactionIndicator;
                    }
                }
                return;
            }
            
            // Skip highlighting for objects marked with noInteractionHighlight (like swivel chairs)
            if (obj.noInteractionHighlight) {
                return;
            }
            
            // Skip objects outside viewport for performance (if viewport bounds available)
            if (viewBounds && (
                obj.x < viewBounds.left || 
                obj.x > viewBounds.right || 
                obj.y < viewBounds.top || 
                obj.y > viewBounds.bottom)) {
                // Clear highlight if object is outside viewport
                if (obj.isHighlighted) {
                    obj.isHighlighted = false;
                    obj.clearTint();
                    removeProximityGhost(obj);
                    // Clean up interaction sprite if exists
                    if (obj.interactionIndicator) {
                        obj.interactionIndicator.destroy();
                        delete obj.interactionIndicator;
                    }
                }
                return;
            }

            // Use simple radial distance from player centre (matches visual highlight zone)
            const dx = obj.x - px;
            const dy = obj.y - py;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq <= INTERACTION_RANGE_SQ) {
                if (!obj.isHighlighted) {
                    obj.isHighlighted = true;
                    // Only apply tint if this is a sprite (has setTint method)
                    if (obj.setTint && typeof obj.setTint === 'function') {
                        obj.setTint(0x4da6ff);  // Blue tint for interactable objects
                    }
                    // Ghost at extreme depth so item silhouette shows through walls
                    addProximityGhost(obj);
                    // Add interaction indicator sprite
                    addInteractionIndicator(obj);
                }
            } else if (obj.isHighlighted) {
                obj.isHighlighted = false;
                // Only clear tint if this is a sprite
                if (obj.clearTint && typeof obj.clearTint === 'function') {
                    obj.clearTint();
                }
                removeProximityGhost(obj);
                // Clean up interaction sprite if exists
                if (obj.interactionIndicator) {
                    obj.interactionIndicator.destroy();
                    delete obj.interactionIndicator;
                }
            }
        });
        
        // Also check door sprites
        if (room.doorSprites) {
            Object.values(room.doorSprites).forEach(door => {
                // Skip if door is destroyed, inactive, not a valid door sprite, or already open
                if (!door || door.scene === null || !door.active || !door.doorProperties || door.doorProperties.open) {
                    // Clear highlight if door was previously highlighted
                    if (door && door.isHighlighted) {
                        door.isHighlighted = false;
                        if (door.clearTint && typeof door.clearTint === 'function') {
                            door.clearTint();
                        }
                        // Clean up interaction sprite if exists
                        if (door.interactionIndicator) {
                            door.interactionIndicator.destroy();
                            delete door.interactionIndicator;
                        }
                    }
                    return;
                }
                
                // Skip doors outside viewport for performance (if viewport bounds available)
                if (viewBounds && (
                    door.x < viewBounds.left || 
                    door.x > viewBounds.right || 
                    door.y < viewBounds.top || 
                    door.y > viewBounds.bottom)) {
                    // Clear highlight if door is outside viewport
                    if (door.isHighlighted) {
                        door.isHighlighted = false;
                        door.clearTint();
                        // Clean up interaction sprite if exists
                        if (door.interactionIndicator) {
                            door.interactionIndicator.destroy();
                            delete door.interactionIndicator;
                        }
                    }
                    return;
                }

                // Use simple radial distance from player centre (matches visual highlight zone)
                const dx = door.x - px;
                const dy = door.y - py;
                const distanceSq = dx * dx + dy * dy;

                if (distanceSq <= DOOR_INTERACTION_RANGE_SQ) {
                    if (!door.isHighlighted) {
                        door.isHighlighted = true;
                        door.setTint(0x4da6ff);  // Blue tint for locked doors
                        // Add interaction indicator sprite for doors
                        addInteractionIndicator(door);
                    }
                } else if (door.isHighlighted) {
                    door.isHighlighted = false;
                    door.clearTint();
                    // Clean up interaction sprite if exists
                    if (door.interactionIndicator) {
                        door.interactionIndicator.destroy();
                        delete door.interactionIndicator;
                    }
                }
            });
        }

        // Also check NPC sprites
        if (room.npcSprites) {
            room.npcSprites.forEach(sprite => {
                // NPCs should always be interactable when present
                if (!sprite.active) {
                    // Clear highlight if sprite was previously highlighted
                    if (sprite.isHighlighted) {
                        sprite.isHighlighted = false;
                        sprite.clearTint();
                        // Clean up interaction sprite if exists
                        if (sprite.interactionIndicator) {
                            sprite.interactionIndicator.destroy();
                            delete sprite.interactionIndicator;
                        }
                    }
                    return;
                }
                
                // Skip NPCs outside viewport for performance (if viewport bounds available)
                if (viewBounds && (
                    sprite.x < viewBounds.left || 
                    sprite.x > viewBounds.right || 
                    sprite.y < viewBounds.top || 
                    sprite.y > viewBounds.bottom)) {
                    // Clear highlight if NPC is outside viewport
                    if (sprite.isHighlighted) {
                        sprite.isHighlighted = false;
                        sprite.clearTint();
                        // Clean up interaction sprite if exists
                        if (sprite.interactionIndicator) {
                            sprite.interactionIndicator.destroy();
                            delete sprite.interactionIndicator;
                        }
                    }
                    return;
                }

                // Check if NPC is hostile - don't show talk icon if so
                const isNPCHostile = sprite.npcId && window.npcHostileSystem && window.npcHostileSystem.isNPCHostile(sprite.npcId);

                // Use simple radial distance from player centre (matches visual highlight zone)
                // (static-sprite NPCs also measure to their collision body, npc-reach.js)
                const npcDx = sprite.x - px;
                const npcDy = sprite.y - py;
                const distanceSq = npcReachDistSq(player, sprite, npcDx * npcDx + npcDy * npcDy);

                if (distanceSq <= INTERACTION_RANGE_SQ && sprite.visible) {
                    if (!sprite.isHighlighted) {
                        sprite.isHighlighted = true;
                        // Add talk icon indicator for NPC (created on first highlight)
                        if (!sprite.interactionIndicator) {
                            addInteractionIndicator(sprite);
                        }
                        // Show talk icon only if NPC is NOT hostile
                        if (sprite.interactionIndicator && !isNPCHostile) {
                            sprite.interactionIndicator.setVisible(true);
                            sprite.talkIconVisible = true;
                        } else if (sprite.interactionIndicator && isNPCHostile) {
                            sprite.interactionIndicator.setVisible(false);
                            sprite.talkIconVisible = false;
                        }
                    } else if (sprite.interactionIndicator && !sprite.talkIconVisible && !isNPCHostile) {
                        // Update position of talk icon to stay pixel-perfect on NPC
                        const iconX = Math.round(sprite.x + 5);
                        const iconY = Math.round(sprite.y - 38);
                        sprite.interactionIndicator.setPosition(iconX, iconY);
                        sprite.interactionIndicator.setVisible(true);
                        sprite.talkIconVisible = true;
                    } else if (isNPCHostile && sprite.interactionIndicator && sprite.talkIconVisible) {
                        // Hide icon if NPC became hostile
                        sprite.interactionIndicator.setVisible(false);
                        sprite.talkIconVisible = false;
                    }
                } else if (sprite.isHighlighted || !sprite.visible) {
                    sprite.isHighlighted = false;
                    sprite.clearTint();
                    // Hide talk icon when out of range or NPC becomes invisible
                    if (sprite.interactionIndicator) {
                        sprite.interactionIndicator.setVisible(false);
                        sprite.talkIconVisible = false;
                    }
                } else if (sprite.interactionIndicator && sprite.talkIconVisible) {
                    // Update position every frame when icon is visible (smooth following)
                    const iconX = Math.round(sprite.x + 5);
                    const iconY = Math.round(sprite.y - 38);
                    sprite.interactionIndicator.setPosition(iconX, iconY);
                }
            });
        }
    });
}

function getInteractionSpriteKey(obj) {
    // Determine which sprite to show based on the object's interaction type
    
    // Check for NPCs first
    if (obj._isNPC) {
        return 'interact'; // Use generic interact sprite for NPCs
    }
    
    // Check for doors (they may not have scenarioData)
    if (obj.doorProperties) {
        if (obj.doorProperties.locked) {
            // Check door lock type
            const lockType = obj.doorProperties.lockType;
            if (lockType === 'password') return 'password';
            if (lockType === 'pin') return 'pin';
            if (lockType === 'backup_recovery') return 'password';
            if (lockType === 'biometric') return 'fingerprint';
            if (lockType === 'rfid') return 'nfc-waves';
            return 'keyway'; // Default to keyway for key locks or unknown types
        }
        return null; // Unlocked doors don't need overlay
    }
    
    if (!obj || !obj.scenarioData) {
        return null;
    }
    
    const data = obj.scenarioData;
    
    // Check for locked containers and items
    if (data.locked === true) {
        // Check specific lock type
        const lockType = data.lockType;
        if (lockType === 'password') return 'password';
        if (lockType === 'pin') return 'pin';
        if (lockType === 'backup_recovery') return 'password';
        if (lockType === 'biometric') return 'fingerprint';
        if (lockType === 'rfid') return 'nfc-waves';
        if (lockType === 'flag') return 'password';
        // Default to keyway for key locks or unknown types
        return 'keyway';
    }
    
    // Unlocked containers don't need an overlay
    // (they'll be opened via the container minigame when interacted with)
    if (data.contents) {
        return null; // No overlay for unlocked containers
    }
    
    // Check for fingerprint collection
    if (data.hasFingerprint === true) {
        return 'fingerprint';
    }
    
    return null;
}

// Creates a ghost copy of a static object's sprite at depth 9000, tinted blue at
// 20% alpha, so it bleeds through walls/tables to hint the player of a nearby item.
function addProximityGhost(obj) {
    if (!obj.scene || !obj.scene.add) return;
    if (obj.proximityGhost) return; // Already exists
    if (obj._isNPC) return;         // NPCs use the talk-icon system instead
    if (obj.doorProperties) return; // Doors are always visible; their lock icon is the interactionIndicator

    try {
        const textureKey = obj.texture && obj.texture.key;
        const frameName  = obj.frame  && obj.frame.name  !== undefined ? obj.frame.name  : undefined;

        if (!textureKey || textureKey === '__MISSING') return;

        const ghost = obj.scene.add.image(obj.x, obj.y, textureKey, frameName);
        ghost.setOrigin(obj.originX !== undefined ? obj.originX : 0.5,
                        obj.originY !== undefined ? obj.originY : 0.5);
        ghost.setScale(obj.scaleX, obj.scaleY);
        ghost.setAngle(obj.angle || 0);
        ghost.setDepth(9000);      // Above all world geometry (walls, tables, etc.)
        ghost.setTint(0x4da6ff);   // Full-saturation blue tint
        ghost.setAlpha(0.2);       // 20% - shape is visible, reads as a glow not a copy

        obj.scene.tweens.add({
            targets:  ghost,
            alpha:    { from: 0.15, to: 0.3 },
            duration: 800,
            yoyo:     true,
            repeat:   -1,
            ease:     'Sine.easeInOut'
        });

        obj.proximityGhost = ghost;

        // Self-cleaning: patch setVisible so the ghost is destroyed the instant
        // the sprite is hidden (collection, any code path, async or not).
        // We store the original so removeProximityGhost can restore it.
        if (obj.setVisible && !obj._preGhostSetVisible) {
            obj._preGhostSetVisible = obj.setVisible.bind(obj);
            obj.setVisible = function(visible) {
                obj._preGhostSetVisible(visible);
                if (!visible) removeProximityGhost(obj);
            };
        }
    } catch (error) {
        console.warn('Failed to add proximity ghost:', error);
    }
}

function removeProximityGhost(obj) {
    if (obj.proximityGhost) {
        obj.proximityGhost.destroy();
        delete obj.proximityGhost;
    }
    // Restore the original setVisible so the patch doesn't linger
    if (obj._preGhostSetVisible) {
        obj.setVisible = obj._preGhostSetVisible;
        delete obj._preGhostSetVisible;
    }
}

function addInteractionIndicator(obj) {
    // Only add indicator if we have a game instance and the object has a scene
    if (!gameRef || !obj.scene || !obj.scene.add) {
        return;
    }
    
    // NPCs get the talk icon above their heads with pixel-perfect positioning
    if (obj._isNPC) {
        try {
            // Talk icon positioned above NPC with pixel-perfect coordinates
            const talkIconX = Math.round(obj.x + 5); // Centered above
            const talkIconY = Math.round(obj.y - 38); // 32 pixels above
            
            const indicator = obj.scene.add.image(talkIconX, talkIconY, 'talk');
            indicator.setDepth(obj.depth + 1);
            indicator.setVisible(false); // Hidden until player is in range
            
            // Store reference for cleanup and visibility management
            obj.interactionIndicator = indicator;
            obj.talkIconVisible = false;
        } catch (error) {
            console.warn('Failed to add talk icon for NPC:', error);
        }
        return;
    }
    
    // Non-NPC objects use the standard interaction indicator sprite
    const spriteKey = getInteractionSpriteKey(obj);
    if (!spriteKey) return;
    
    // Create indicator sprite centered over the object
    try {
        // Get the center of the parent sprite, accounting for its origin
        const center = obj.getCenter();
        
        // Position indicator above the object (accounting for parent's display height)
        const indicatorX = center.x;
        const indicatorY = center.y; // Position above with 10px offset
        
        const indicator = obj.scene.add.image(indicatorX, indicatorY, spriteKey);
        indicator.setDepth(999); // High depth to appear on top
        indicator.setOrigin(0.5, 0.5); // Center the sprite
        // indicator.setScale(0.5); // Scale down to be less intrusive
        
        // Add pulsing animation
        obj.scene.tweens.add({
            targets: indicator,
            alpha: { from: 1, to: 0.5 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // Store reference for cleanup
        obj.interactionIndicator = indicator;
    } catch (error) {
        console.warn('Failed to add interaction indicator:', error);
    }
}

export function handleObjectInteraction(sprite) {
    console.log('OBJECT INTERACTION', { 
        name: sprite.name, 
        id: sprite.objectId,
        scenarioData: sprite.scenarioData
    });
    
    if (!sprite) {
        console.warn('Invalid sprite');
        return;
    }
    
    // Emit object interaction event (for NPCs to react)
    if (window.eventDispatcher && sprite.scenarioData) {
        window.eventDispatcher.emit('object_interacted', {
            objectType: sprite.scenarioData.type,
            objectName: sprite.scenarioData.name,
            roomId: window.currentPlayerRoom
        });
    }
    
    // Handle swivel chair interaction - trigger punch to kick it!
    if (sprite.isSwivelChair && sprite.body) {
        const player = window.player;
        if (player && window.playerCombat) {
            // In interact mode, auto-switch to jab for chairs
            const currentMode = window.playerCombat.getInteractionMode();
            const wasInteractMode = currentMode === 'interact';
            
            if (wasInteractMode) {
                console.log('🪑 Chair in interact mode - auto-jabbing');
                window.playerCombat.setInteractionMode('jab');
            }
            
            // Trigger punch to kick the chair
            window.playerCombat.punch();
            
            // Restore interact mode if we switched
            if (wasInteractMode) {
                setTimeout(() => {
                    window.playerCombat.setInteractionMode('interact');
                }, 100);
            }
        }
        return;
    }
    
    // Handle NPC sprite interaction
    if (sprite._isNPC && sprite.npcId) {
        console.log('NPC INTERACTION', { npcId: sprite.npcId });
        
        // Check if NPC is hostile
        const isHostile = window.npcHostileSystem && window.npcHostileSystem.isNPCHostile(sprite.npcId);
        
        // If hostile and in interact mode, auto-jab instead of talking
        if (isHostile && window.playerCombat) {
            const currentMode = window.playerCombat.getInteractionMode();
            const wasInteractMode = currentMode === 'interact';
            
            if (wasInteractMode) {
                console.log('👊 Hostile NPC in interact mode - auto-jabbing');
                window.playerCombat.setInteractionMode('jab');
            }
            
            // Punch the hostile NPC
            window.playerCombat.punch();
            
            // Restore interact mode if we switched
            if (wasInteractMode) {
                setTimeout(() => {
                    window.playerCombat.setInteractionMode('interact');
                }, 100);
            }
            return;
        }
        
        // Non-hostile NPCs - start chat minigame
        if (window.MinigameFramework && window.npcManager) {
            const npc = window.npcManager.getNPC(sprite.npcId);
            if (npc) {
                // Start person-chat minigame with this NPC
                window.MinigameFramework.startMinigame('person-chat', null, {
                    npcId: sprite.npcId,
                    title: npc.displayName || sprite.npcId,
                    disableClose: npc.disableClose === true
                });
                return;
            } else {
                console.warn('NPC not found in manager:', sprite.npcId);
            }
        } else {
            console.warn('MinigameFramework or npcManager not available');
        }
        return;
    }

    if (!sprite.scenarioData) {
        console.warn('Invalid sprite or missing scenario data');
        return;
    }

    // triggerOnInteract: fire scenario-defined actions immediately on interaction,
    // with no minigame or flag entry required. Defined at the object's top level in the scenario.
    if (Array.isArray(sprite.scenarioData.triggerOnInteract)) {
        console.log('[Interaction] triggerOnInteract firing for:', sprite.scenarioData.name || sprite.objectId);
        applyActions(sprite.scenarioData.triggerOnInteract, { source: 'object_interact' });
        return;
    }

    // Notify tutorial when inventory item is clicked
    // Items in inventory have takeable set to false
    if (sprite.scenarioData.takeable === false && window.getTutorialManager) {
        const tutorialManager = window.getTutorialManager();
        tutorialManager.notifyPlayerClickedInventoryItem();
    }

    // Handle keycard cloning (when clicked from inventory)
    // Only intercept if the card is already in inventory (takeable === false).
    // If takeable is true the card is still in the world and should be picked up normally.
    if (sprite.scenarioData.type === 'keycard' && sprite.scenarioData.takeable === false) {
        console.log('KEYCARD INTERACTION (inventory) - checking for cloner');

        // Check if player has RFID cloner
        const hasCloner = window.inventory.items.some(item =>
            item && item.scenarioData &&
            item.scenarioData.type === 'rfid_cloner'
        );

        if (hasCloner) {
            // Start RFID minigame in clone mode
            console.log('Starting RFID clone for keycard:', sprite.scenarioData.name);
            if (window.startRFIDMinigame) {
                window.startRFIDMinigame(null, null, {
                    mode: 'clone',
                    cardToClone: sprite.scenarioData
                });
            } else {
                window.gameAlert('RFID minigame not available', 'error', 'Error', 3000);
            }
        } else {
            window.gameAlert('You need an RFID cloner to clone this card', 'info', 'No Cloner', 3000);
        }
        return; // Early return
    }

    // Interactive takeable items: pick up on first interaction, auto-open 1 second later.
    // Covers any item type whose in-inventory interaction opens a minigame or tool.
    // The specific handlers below already handle the takeable=false (in-inventory) case.
    const PICKUP_THEN_INTERACT_TYPES = new Set([
        'workstation', 'lab-workstation',
        'vm-launcher', 'vm_launcher',
        'launch-device', 'phone'
    ]);
    if (sprite.scenarioData.takeable && PICKUP_THEN_INTERACT_TYPES.has(sprite.scenarioData.type)) {
        playUISound('item');
        addToInventory(sprite);
        setTimeout(() => handleObjectInteraction(sprite), 1000);
        return;
    }

    // Handle the Crypto Workstation - pick it up if takeable, or use it if in inventory
    if (sprite.scenarioData.type === "workstation") {
        // If it's in inventory (marked as non-takeable), open it
        if (!sprite.scenarioData.takeable) {
            console.log('OPENING WORKSTATION FROM INVENTORY');
            if (window.openCryptoWorkstation) {
                window.openCryptoWorkstation();
            } else {
                window.gameAlert('Crypto workstation not available', 'error', 'Error', 3000);
            }
            return;
        }
        
        // Otherwise, try to pick it up and add to inventory
        console.log('WORKSTATION ADDED TO INVENTORY');
        playUISound('item');
        addToInventory(sprite);
        window.gameAlert(`${sprite.scenarioData.name} added to inventory. You can now use it for cryptographic analysis.`, 'success', 'Item Acquired', 5000);
        return;
    }
    
    // Handle the Lab Workstation - opens lab sheets in iframe
    if (sprite.scenarioData.type === "lab-workstation") {
        // If it's in inventory (marked as non-takeable), open it
        if (!sprite.scenarioData.takeable) {
            console.log('OPENING LAB WORKSTATION FROM INVENTORY');
            const labUrl = sprite.scenarioData.labUrl || sprite.scenarioData.url;
            if (labUrl && window.openLabWorkstation) {
                window.openLabWorkstation(labUrl);
            } else {
                window.gameAlert('Lab workstation not available', 'error', 'Error', 3000);
            }
            return;
        }
        
        // Otherwise, try to pick it up and add to inventory
        console.log('LAB WORKSTATION ADDED TO INVENTORY');
        playUISound('item');
        addToInventory(sprite);
        window.gameAlert(`${sprite.scenarioData.name} added to inventory. You can now use it to access lab sheets.`, 'success', 'Item Acquired', 5000);
        return;
    }
    
    // Handle the Notepad - open notes minigame
    if (sprite.scenarioData.type === "notepad") {
        if (window.startNotesMinigame) {
            // Check if notes minigame is specifically already running
            if (window.MinigameFramework && window.MinigameFramework.currentMinigame && 
                window.MinigameFramework.currentMinigame.navigateToNoteIndex) {
                console.log('Notes minigame already running, navigating to notepad note instead');
                // If notes minigame is already running, just navigate to the notepad note
                if (window.MinigameFramework.currentMinigame.navigateToNoteIndex) {
                    window.MinigameFramework.currentMinigame.navigateToNoteIndex(0);
                }
                return;
            }
            
            // Navigate to the notepad note (index 0) when clicking the notepad
            // Create a minimal item just for navigation - no auto-add needed
            const notepadItem = {
                scenarioData: {
                    type: 'notepad',
                    name: 'Notepad'
                }
            };
            window.startNotesMinigame(notepadItem, '', '', 0, false, false);
            return;
        }
    }
    
    // Handle the BLE Scanner - only open minigame if it's already in inventory
    if (sprite.scenarioData.type === "ble_scanner") {
        const isInventoryItem = sprite.objectId && sprite.objectId.startsWith('inventory_');
        if (isInventoryItem && window.startBleScannerMinigame) {
            console.log('Starting BLE scanner minigame from inventory');
            window.startBleScannerMinigame(sprite);
            return;
        }
    }

    // Handle the Bluetooth Scanner - only open minigame if it's already in inventory
    if (sprite.scenarioData.type === "bluetooth_scanner") {
        // Check if this is an inventory item (clicked from inventory)
        const isInventoryItem = sprite.objectId && sprite.objectId.startsWith('inventory_');
        
        if (isInventoryItem && window.startBluetoothScannerMinigame) {
            console.log('Starting bluetooth scanner minigame from inventory');
            window.startBluetoothScannerMinigame(sprite);
            return;
        }
        // If it's not in inventory, let it fall through to the takeable logic below
    }
    
    // Handle the Fingerprint Kit - only open minigame if it's already in inventory
    if (sprite.scenarioData.type === "fingerprint_kit") {
        // Check if this is an inventory item (clicked from inventory)
        const isInventoryItem = sprite.objectId && sprite.objectId.startsWith('inventory_');
        
        if (isInventoryItem && window.startBiometricsMinigame) {
            console.log('Starting biometrics minigame from inventory');
            window.startBiometricsMinigame(sprite);
            return;
        }
        // If it's not in inventory, let it fall through to the takeable logic below
    }

    // Handle the RFID Cloner (RFID Flipper) - only open minigame if it's already in inventory
    if (sprite.scenarioData.type === "rfid_cloner") {
        // Check if this is an inventory item (clicked from inventory)
        const isInventoryItem = sprite.objectId && sprite.objectId.startsWith('inventory_');
        
        if (isInventoryItem && window.startRFIDMinigame) {
            console.log('Starting RFID minigame from inventory (unlock mode)');
            window.startRFIDMinigame(null, null, {
                mode: 'unlock',
                availableCards: [],
                hasCloner: true
            });
            return;
        }
        // If it's not in inventory, let it fall through to the takeable logic below
    }
    
    // Handle VM Launcher interaction
    if (sprite.scenarioData.type === "vm-launcher" || sprite.scenarioData.type === "vm_launcher") {
        console.log('VM Launcher interaction:', sprite.scenarioData);
        if (window.MinigameFramework) {
            // Get VM data from scenario
            const vm = sprite.scenarioData.vm || null;
            const hacktivityMode = sprite.scenarioData.hacktivityMode || window.breakEscapeConfig?.hacktivityMode || false;
            
            window.MinigameFramework.startMinigame('vm-launcher', null, {
                title: sprite.scenarioData.name || 'VM Console Access',
                vm: vm,
                hacktivityMode: hacktivityMode,
                stationId: sprite.scenarioData.id || sprite.objectId,
                showPostit: sprite.scenarioData.showPostit || false,
                postitNote: sprite.scenarioData.postitNote || ''
            });
            return;
        }
    }

    // Handle SIEM dashboard consoles by object type (not lockType)
    if (sprite.scenarioData.type === 'siem_dashboard') {
        console.log('SIEM dashboard interaction:', sprite.scenarioData);

        if (window.startSiemMinigame) {
            window.startSiemMinigame(sprite, (success, result) => {
                console.log('SIEM minigame closed', { success, result });

                // Match existing unlock flow: only mark unlock progress on successful completion.
                if (!success) return;

                const siemObjectId = sprite.scenarioData.id || sprite.objectId;
                if (window.gameState) {
                    window.gameState.unlockedObjects = window.gameState.unlockedObjects || [];
                    if (siemObjectId && !window.gameState.unlockedObjects.includes(siemObjectId)) {
                        window.gameState.unlockedObjects.push(siemObjectId);
                    }
                }

                if (window.eventDispatcher) {
                    window.eventDispatcher.emit('item_unlocked', {
                        itemId: siemObjectId,
                        itemType: sprite.scenarioData.type,
                        itemName: sprite.scenarioData.name
                    });
                }
            }, {
                timeLimitSec: sprite.scenarioData.timeLimitSec
            });
        } else {
            window.gameAlert('SIEM minigame unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle infusion pump terminal (MG-08)
    if (sprite.scenarioData.type === 'infusion_pump') {
        console.log('Infusion pump interaction:', sprite.scenarioData);
        if (window.startInfusionPumpMinigame) {
            window.startInfusionPumpMinigame(sprite, 'item', (success) => {
                console.log('Infusion pump minigame closed, success:', success);
            });
        } else {
            window.gameAlert('Pump terminal unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle MG14 EHR terminal by object id.
    if (sprite.scenarioData.id === 'ehr_terminal') {
        console.log('EHR terminal interaction:', sprite.scenarioData);

        if (window.startEhrTerminalMinigame) {
            window.startEhrTerminalMinigame(sprite);
        } else {
            window.gameAlert('EHR terminal unavailable.', 'error', 'Error', 3000);
                  }
        return;
    }
  
    // Handle Major Incident Command Board
    if (sprite.scenarioData.type === 'command_board') {
        if (window.startCommandBoardMinigame) {
            window.startCommandBoardMinigame(sprite);
        } else {
            window.gameAlert('Command board unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle Claims Management System terminal (SIS03 MG-01)
    if (sprite.scenarioData.id === 'claims_management_system' ||
        sprite.scenarioData.type === 'cms_terminal') {
        if (window.startClaimsManagementSystemMinigame) {
            window.startClaimsManagementSystemMinigame(sprite);
        } else {
            window.gameAlert('Claims management terminal unavailable.', 'error', 'Error', 3000);
        }
        return;
    }
    
    // Handle Warranty Compliance Checklist (SIS03 MG-04)
    if (sprite.scenarioData.id === 'warranty_checklist' ||
        sprite.scenarioData.type === 'warranty_checklist') {
        if (window.startWarrantyChecklistMinigame) {
            window.startWarrantyChecklistMinigame(sprite);
        } else {
            window.gameAlert('Warranty checklist unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle Blockchain Explorer
    if (sprite.scenarioData.interactionType === 'blockchain_explorer') {
        if (window.startBlockchainExplorerMinigame) {
            window.startBlockchainExplorerMinigame(sprite);
        } else {
            window.gameAlert('Chain analysis terminal unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle Shredded Document Reconstruction (MG-B)
    if (sprite.scenarioData.type === 'shredder' ||
        sprite.scenarioData.interactionType === 'shredded_document') {
        if (window.startShreddedDocumentMinigame) {
            window.startShreddedDocumentMinigame(sprite);
        } else {
            window.gameAlert('Shredded document unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle Flag Station / Launch Device interaction
    if (sprite.scenarioData.type === "flag-station" ||
        sprite.scenarioData.type === "flag_station" ||
        sprite.scenarioData.type === "launch-device") {
        console.log('Flag Station interaction:', sprite.scenarioData);
        if (window.MinigameFramework) {
            window.MinigameFramework.startMinigame('flag-station', null, {
                title:             sprite.scenarioData.name || 'Flag Submission Terminal',
                stationId:         sprite.scenarioData.id || sprite.scenarioData.name || sprite.objectId,
                stationName:       sprite.scenarioData.name,
                mode:              sprite.scenarioData.mode || 'standard',
                // Server sends a count, not the values (see Game#filter_requires_and_contents_recursive).
                flagCount:         sprite.scenarioData.flagCount ?? (sprite.scenarioData.flags || []).length,
                acceptsVms:        sprite.scenarioData.acceptsVms || [],
                onAbort:           sprite.scenarioData.onAbort  || null,
                onLaunch:          sprite.scenarioData.onLaunch || null,
                abortConfirmText:  sprite.scenarioData.abortConfirmText  || null,
                launchConfirmText: sprite.scenarioData.launchConfirmText || null,
                flagsAllSubmitted: sprite.scenarioData.flagsAllSubmitted === true,
                submittedFlags:    window.gameState?.submittedFlags || [],
                gameId:            window.breakEscapeConfig?.gameId || window.gameConfig?.gameId
            });
            return;
        }
    }
    
    // Handle Network Segmentation Map interaction
    if (sprite.scenarioData.type === "network-segmentation-map" ||
        sprite.scenarioData.type === "network_segmentation_map") {
        console.log('Network Segmentation Map interaction:', sprite.scenarioData);
        if (window.startNetworkSegmentationMapMinigame) {
            window.startNetworkSegmentationMapMinigame(sprite.scenarioData.minigameData || sprite.scenarioData, {
                onComplete: (success) => {
                    console.log('[NSM] Interaction complete, network_isolated:', success);
                }
            });
        } else {
            console.error('[NSM] startNetworkSegmentationMapMinigame not available');
        }
        return;
    }

    // Handle SIS configuration panel interaction
    if (sprite.scenarioData.id === 'sis_config_panel' ||
        sprite.scenarioData.type === 'sis_config_panel') {
        console.log('SIS config panel interaction:', sprite.scenarioData);

        if (window.startSisConfigThresholdMinigame) {
            window.startSisConfigThresholdMinigame(sprite);
        } else {
            window.gameAlert('SIS configuration minigame unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle SCADA Historian Terminal (VM-01 sis02)
    if (sprite.scenarioData.type === 'scada_historian') {
        const minigameId = sprite.scenarioData?.minigameData?.minigameId || 'scada-historian';
        if (window.MinigameFramework) {
            if (!window.MinigameFramework.mainGameScene)
                window.MinigameFramework.init(window.game);
            window.MinigameFramework.startMinigame(minigameId, null, {
                title: sprite.scenarioData?.title || 'SCADA Historian',
                showCancel: true,
                cancelText: 'Close',
                sprite
            });
        }
        return;
    }

    // Handle Log Filter Terminal (VM-02 sis02 / MG-06 sis01)
    if (sprite.scenarioData.type === 'log_filter_terminal') {
        const minigameId = sprite.scenarioData?.minigameData?.minigameId || 'log-filter';
        if (window.MinigameFramework) {
            if (!window.MinigameFramework.mainGameScene)
                window.MinigameFramework.init(window.game);
            window.MinigameFramework.startMinigame(minigameId, null, {
                title: sprite.scenarioData?.title || 'Access Log Analyser',
                showCancel: true,
                cancelText: 'Close',
                sprite
            });
        }
        return;
    }
  
    // Handle Drug Library Integrity Terminal (MG-09 sis01)
    if (sprite.scenarioData.type === 'drug_library_terminal') {
        console.log('Drug library dispatch firing, calling starter...', { fn: typeof window.startDrugLibraryIntegrityMinigame });
        if (window.startDrugLibraryIntegrityMinigame) {
            window.startDrugLibraryIntegrityMinigame(sprite);
        } else {
            window.gameAlert('Drug Library terminal unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle Backup Recovery Console (MG-07)
    if (sprite.scenarioData.type === 'backup_recovery') {
        if (window.startBackupRecoveryMinigame) {
            window.startBackupRecoveryMinigame(sprite, 'backup_recovery', (success) => {
                console.log('Backup recovery minigame closed', { success });
            });
        } else {
            window.gameAlert('Backup recovery console unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle NCSC Attribution Brief (MG-03 sis03)
    if (sprite.scenarioData.type === 'ncsc_brief') {
        if (window.startNcscBriefMinigame) {
            window.startNcscBriefMinigame(sprite);
        } else {
            window.gameAlert('NCSC Brief unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle Forensic Data Platform terminal (MG-02 sis03)
    if (sprite.scenarioData.type === 'forensic_data_platform') {
        console.log('Forensic Data Platform interaction:', sprite.scenarioData);
        if (window.startForensicDataPlatformMinigame) {
            window.startForensicDataPlatformMinigame(sprite.scenarioData.minigameData || sprite.scenarioData, {
                onComplete: () => {}
            });
        } else {
            window.gameAlert('Forensic Data Platform unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle Coverage Decision Form (MG-05 sis03)
    if (sprite.scenarioData.type === 'coverage_decision_form') {
        if (window.startCoverageDecisionFormMinigame) {
            window.startCoverageDecisionFormMinigame(sprite);
        } else {
            window.gameAlert('Coverage Decision Form unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle ESD pushbutton by object-type interaction
    if (sprite.scenarioData.type === 'emergency-button') {
        console.log('ESD pushbutton interaction:', sprite.scenarioData);

        if (window.startEsdPushbuttonMinigame) {
            window.startEsdPushbuttonMinigame(sprite);
        } else {
            window.gameAlert('ESD minigame unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle alarm panel by object-type interaction
    if (sprite.scenarioData.type === 'alarm_panel') {
        console.log('Alarm panel interaction:', sprite.scenarioData);

        if (window.startAlarmPanelMinigame) {
            window.startAlarmPanelMinigame(sprite, sprite.scenarioData.type || 'object', () => {});
        } else {
            window.gameAlert('Alarm panel minigame unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle network architecture diagram by object-type interaction
    if (sprite.scenarioData.type === 'network_architecture') {
        console.log('Network architecture interaction:', sprite.scenarioData);

        if (window.startNetworkArchitectureMinigame) {
            window.startNetworkArchitectureMinigame(sprite.scenarioData.minigameData || sprite.scenarioData, {
                onComplete: () => {}
            });
        } else {
            window.gameAlert('Network architecture minigame unavailable.', 'error', 'Error', 3000);
        }
        return;
    }

    // Handle the Lockpick Set - pick it up if takeable, or use it if in inventory
    if (sprite.scenarioData.type === "lockpick" || sprite.scenarioData.type === "lockpickset") {
        // If it's in inventory (marked as non-takeable), just acknowledge it
        if (!sprite.scenarioData.takeable) {
            console.log('LOCKPICK ALREADY IN INVENTORY');
            window.gameAlert(`Used to pick pin tumbler locks.`, 'info', `${sprite.scenarioData.name}.`, 3000);
            return;
        }
        
        // Otherwise, try to pick it up and add to inventory
        console.log('LOCKPICK SET ADDED TO INVENTORY');
        playUISound('item');
        addToInventory(sprite);
        window.gameAlert(`${sprite.scenarioData.name} added to inventory. You can now use it to pick locks.`, 'success', 'Item Acquired', 5000);
        return;
    }
    
    // Handle biometric scanner interaction
    if (sprite.scenarioData.biometricType === 'fingerprint') {
        handleBiometricScan(sprite);
        return;
    }
    
    // Check for fingerprint collection possibility. "Use normally" in the dusting panel sets
    // _bypassFingerprintOnce so the object's ordinary interaction (its text, files, contents) runs once.
    const bypassPrint = sprite._bypassFingerprintOnce === true;
    if (bypassPrint) sprite._bypassFingerprintOnce = false;
    if (sprite.scenarioData.hasFingerprint && !bypassPrint) {
        // Check if player has fingerprint kit
        const hasKit = window.inventory.items.some(item => 
            item && item.scenarioData && 
            item.scenarioData.type === 'fingerprint_kit'
        );
        
        if (hasKit) {
            // Returns null (fall through) once the surface has given an excellent lift
            const started = collectFingerprint(sprite);
            if (started) {
                return; // The dusting minigame is open
            }
        } else if (!sprite._fingerprintHintShown) {
            // No kit: carry on with the normal interaction, and say once that prints are here
            sprite._fingerprintHintShown = true;
            window.gameAlert("There are prints on this. A fingerprint kit could lift them.", 'info', 'Fingerprints', 4000);
        }
    }
    
    // Skip range check for inventory items
    const isInventoryItem = window.inventory && window.inventory.items.includes(sprite);
    if (!isInventoryItem) {
        // Check if player is in range
        const player = window.player;
        if (!player) return;
        
        // Measure distance with direction-based offset
        const distanceSq = getInteractionDistance(player, sprite.x, sprite.y);
        
        if (distanceSq > INTERACTION_RANGE_SQ) {
            console.log('INTERACTION_OUT_OF_RANGE', { 
                objectName: sprite.name,
                objectId: sprite.objectId,
                distance: Math.sqrt(distanceSq),
                maxRange: Math.sqrt(INTERACTION_RANGE_SQ)
            });
            return;
        }
    }
    
    const data = sprite.scenarioData;
    
    // Flag-locked items: submit a flag to unlock, validated server-side via /unlock endpoint
    if (data.locked === true && data.lockType === 'flag') {
        window.MinigameFramework.startMinigame('flag-station', null, {
            mode: 'lock',
            objectId: data.id,
            lockable: sprite,
            type: 'item',
            title: `Unlock: ${data.name}`,
            onComplete: (success, result) => {
                if (success) {
                    window.unlockTarget?.(sprite, 'item', sprite.layer, result?.serverResponse);
                }
            }
        });
        return;
    }

    // Handle container items (suitcase, briefcase, bags, bins, etc.) - check BEFORE lock check
    // hasContents: the server strips a locked container's contents and marks it instead
    if (data.type === 'suitcase' || data.type === 'briefcase' || data.type === 'bag1' || data.type === 'bin1' || data.contents || data.hasContents) {
        console.log('CONTAINER ITEM INTERACTION', data);

        // SECURITY: Always validate with server
        // Client cannot be trusted to determine lock state
        // The unlock system will handle both locked and unlocked containers via server validation
        console.log('Validating container access with server...');
        handleUnlock(sprite, 'item');
        return;
    }
    
    // Check if item is locked (non-container items)
    if (data.locked === true) {
        console.log('ITEM LOCKED', data);
        handleUnlock(sprite, 'item');
        return;
    }
    
    const resolvedObservations = resolveObjectField(data, 'observations', sprite.observations || null);
    const resolvedText = resolveObjectField(data, 'text', null);

    let message = `${data.name || sprite.name} `;
    if (resolvedObservations) {
        message += `Observations: ${resolvedObservations}\n`;
    }
    
    // For phone type objects, use phone-chat with runtime conversion or direct NPC access
    if (data.type === 'phone' && (data.text || data.voice || data.npcIds)) {
        console.log('Phone object detected:', { type: data.type, text: data.text, voice: data.voice, npcIds: data.npcIds });
        
        // Check if phone-chat system is available
        if (window.MinigameFramework && window.npcManager) {
            const phoneId = data.phoneId || 'default_phone';
            
            // Check if phone has already been converted or has npcIds
            if (data.npcIds && data.npcIds.length > 0) {
                console.log('Phone has npcIds, opening phone-chat directly', { npcIds: data.npcIds });
                // Phone already has NPCs, open directly
                window.MinigameFramework.startMinigame('phone-chat', null, {
                    phoneId: phoneId,
                    npcIds: data.npcIds,
                    title: data.name || 'Phone',
                    theme: window.npcManager.getNPC(data.npcIds[0])?.phoneTheme
                });
                return;
            }
            
            // Need to convert simple message - import the converter
            import('../utils/phone-message-converter.js').then(module => {
                const PhoneMessageConverter = module.default;
                
                // Convert simple message to virtual NPC
                const npcId = PhoneMessageConverter.convertAndRegister(data, window.npcManager);
                
                if (npcId) {
                    // Update phone object to reference the NPC
                    data.phoneId = phoneId;
                    data.npcIds = [npcId];
                    
                    // Open phone-chat with converted NPC
                    window.MinigameFramework.startMinigame('phone-chat', null, {
                        phoneId: phoneId,
                        title: data.name || 'Phone',
                        theme: data.theme
                    });
                } else {
                    console.error('Failed to convert phone object to virtual NPC');
                }
            }).catch(error => {
                console.error('Failed to load PhoneMessageConverter:', error);
            });
            
            return; // Exit early
        } else {
            console.warn('Phone-chat system not available (MinigameFramework or npcManager missing)');
        }
    }
    
    // For text_file type objects, use the text file minigame
    if (data.type === 'text_file' && resolvedText) {
        console.log('Text file object detected:', { type: data.type, name: data.name, text: resolvedText });

        // Fire onRead.setVariable, or onPickup when there is no onRead (as notes do).
        // A takeable file is also taken below, so onPickup is its pickup action.
        const readAction = data.onRead || data.onPickup;
        if (readAction?.setVariable && window.gameState?.globalVariables) {
            Object.entries(readAction.setVariable).forEach(([varName, value]) => {
                const oldValue = window.gameState.globalVariables[varName];
                window.gameState.globalVariables[varName] = value;
                console.log(`📖 onRead.setVariable: ${varName} = ${value}`);
                if (window.npcConversationStateManager) {
                    window.npcConversationStateManager.broadcastGlobalVariableChange(varName, value, null);
                }
                if (window.eventDispatcher) {
                    window.eventDispatcher.emit(`global_variable_changed:${varName}`, {
                        name: varName, value, oldValue
                    });
                }
            });
        }

        // Start the text file minigame
        if (window.MinigameFramework) {
            // Initialize the framework if not already done
            if (!window.MinigameFramework.mainGameScene && window.game) {
                window.MinigameFramework.init(window.game);
            }

            const minigameParams = {
                title: `Text File - ${data.name || 'Unknown File'}`,
                fileName: data.name || 'Unknown File',
                fileContent: resolvedText,
                fileType: data.fileType || 'text',
                observations: resolvedObservations,
                lockable: sprite,
                source: data.source || 'Unknown Source',
                onComplete: (success, result) => {
                    console.log('Text file minigame completed:', success, result);
                }
            };

            window.MinigameFramework.startMinigame('text-file', null, minigameParams);

            // A takeable text file in the world goes into the inventory when first read,
            // like notes do. addToInventory registers it with the server, removes the
            // sprite from the room and emits item_picked_up (collect_items tasks count it).
            // Clearing takeable first stops a second click re-taking it.
            if (data.takeable) {
                data.takeable = false;
                Promise.resolve(addToInventory(sprite)).then(res => {
                    // Server refused or network failed: let the player try again
                    if (res && res.ok === false) data.takeable = true;
                });
            }
            return; // Exit early since minigame handles the interaction
        }
    }
    
    // Fixed things you read in place (signs, boards, plaques, device panels):
    // "readDisplay": "gameDisplay" shows the text in a modal instead of opening it as a
    // notebook page. A copy is still saved to notes unless "addToNotes": false (use that
    // for flavour, or for live displays whose text changes with textVariants).
    let readInPlace = false;
    if (data.readable && resolvedText && data.readDisplay === 'gameDisplay') {
        readInPlace = true;
        if (data.addToNotes !== false && window.addNote) {
            const addedNote = window.addNote(data.name, resolvedText, data.important || false);
            if (addedNote) {
                window.gameAlert(`Added "${data.name}" to your notes.`, 'info', 'Note Added', 3000);
            }
        }
    } else if (data.readable && resolvedText) {
        message += `Text: ${resolvedText}\n`;

        // All notes-family items (notes, notes2, notes3, ...) use the notes minigame.
        // They go to notepad (autoAddToNotes in the minigame), never to inventory UI.
        // We still call addToInventory so the server registers the collection —
        // inventory.js skips the UI slot for notes types but still does the server POST,
        // which allows validate_collection on the server to count them correctly.
        if (/^notes\d*$/.test(data.type) && resolvedText) {
            // Process onRead.setVariable for notes items (e.g. whiteboard_cipher_seen)
            // Also accept onPickup.setVariable as a fallback (defensive — onRead is canonical)
            const notesReadAction = data.onRead || data.onPickup;
            if (notesReadAction?.setVariable && window.gameState?.globalVariables) {
                Object.entries(notesReadAction.setVariable).forEach(([varName, value]) => {
                    const oldValue = window.gameState.globalVariables[varName];
                    window.gameState.globalVariables[varName] = value;
                    if (window.npcConversationStateManager) {
                        window.npcConversationStateManager.broadcastGlobalVariableChange(varName, value, null);
                    }
                    if (window.eventDispatcher) {
                        window.eventDispatcher.emit(`global_variable_changed:${varName}`, {
                            name: varName, value, oldValue
                        });
                    }
                });
            }

            if (data.takeable) {
                playUISound('item');
                if (window.eventDispatcher) {
                    window.eventDispatcher.emit(`item_picked_up:${data.type}`, {
                        itemType: data.type,
                        itemName: data.name,
                        itemId: data.id,
                        collectionGroup: data.collection_group || null,
                        roomId: window.currentPlayerRoom
                    });
                }
                sprite.scenarioData.takeable = false; // Prevent re-firing
                addToInventory(sprite); // Register with server (UI slot skipped in inventory.js)
            }
            if (window.startNotesMinigame) {
                window.startNotesMinigame(sprite, resolvedText, resolvedObservations);
                return;
            }
        }

        // Add readable text as a note (fallback for non-notes readable objects)
        // Skip notepad items since they're handled specially
        if (resolvedText.trim().length > 0 && data.type !== 'notepad') {
            const addedNote = window.addNote(data.name, resolvedText, data.important || false);
            if (addedNote) {
                window.gameAlert(`Added "${data.name}" to your notes.`, 'info', 'Note Added', 3000);
            }
        }
    }
    
    if (data.takeable) {
        // Always attempt to add to inventory - addToInventory() handles duplicates
        // and will remove from environment + show notification even if already in inventory
        console.log('ATTEMPTING TO ADD TAKEABLE ITEM', { 
            type: data.type, 
            name: data.name,
            identifier: createItemIdentifier(sprite.scenarioData)
        });
        playUISound('item');
        // KNOWN BUG, deliberately left as-is: addToInventory is async, so this
        // holds a Promise, which is always truthy -- the early return below has
        // never once fired. Awaiting it would need handleObjectInteraction to
        // become async, which changes what every caller gets back, and would
        // make the early return start firing for the first time and suppress
        // observation rendering that players currently see. That is a
        // behavioural change to the pickup path and wants a playtest behind it,
        // not a blind edit. Fixing it is tracked separately from the giveItem
        // item-loss fix that changed addToInventory's return contract.
        const added = addToInventory(sprite);

        // Only show the observation notification if item was NOT added (duplicate)
        // because addToInventory() already shows its own notification
        if (!added) {
            // Item was already in inventory, notification was shown by addToInventory
            return;
        }
    }
    
    // onInteract: DEPRECATED - use triggerOnInteract + observationDisplay instead
    // Legacy handler for simple variable setting and display mode control
    // Falls through to render observation and fire onRead
    if (data.onInteract) {
        console.warn('[Interaction] onInteract is DEPRECATED - use triggerOnInteract + observationDisplay instead:', data.name);
        const applyOnInteract = () => {
            if (data.onInteract.setVariable && window.gameState?.globalVariables) {
                Object.entries(data.onInteract.setVariable).forEach(([varName, value]) => {
                    const oldValue = window.gameState.globalVariables[varName];
                    window.gameState.globalVariables[varName] = value;
                    if (window.npcConversationStateManager) {
                        window.npcConversationStateManager.broadcastGlobalVariableChange(varName, value, null);
                    }
                    if (window.eventDispatcher) {
                        window.eventDispatcher.emit(`global_variable_changed:${varName}`, {
                            name: varName, value, oldValue
                        });
                    }
                });
            }
            if (Array.isArray(data.onInteract.actions)) {
                applyActions(data.onInteract.actions, { source: 'object_interact' });
            }
        };

        const showObservation = () => {
            if (!data.takeable || (data.observations && !data.takeable)) {
                const displayMode = data.onInteract.display;
                if (displayMode === 'gameDisplay' && window.gameDisplay) {
                    window.gameDisplay(message, data.name);
                } else {
                    window.gameAlert(message, 'info', data.name, 5000);
                }
            }
        };

        if (data.onInteract.confirmationText && window.gameConfirm) {
            window.gameConfirm(data.onInteract.confirmationText).then(confirmed => {
                if (confirmed) { applyOnInteract(); showObservation(); }
            });
            return;
        } else {
            applyOnInteract();
        }
        // No return — fall through to onRead and then showObservation below
    }

    // onRead: generic handler for any item type not already handled by a dedicated branch
    if (data.onRead?.setVariable && window.gameState?.globalVariables) {
        Object.entries(data.onRead.setVariable).forEach(([varName, value]) => {
            const oldValue = window.gameState.globalVariables[varName];
            window.gameState.globalVariables[varName] = value;
            if (window.npcConversationStateManager) {
                window.npcConversationStateManager.broadcastGlobalVariableChange(varName, value, null);
            }
            if (window.eventDispatcher) {
                window.eventDispatcher.emit(`global_variable_changed:${varName}`, {
                    name: varName, value, oldValue
                });
            }
        });
    }

    if (readInPlace && window.gameDisplay) {
        const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const body = (resolvedObservations ? `<em>${esc(resolvedObservations)}</em>\n\n` : '') + esc(resolvedText);
        window.gameDisplay(body, esc(data.name || sprite.name));
        return;
    }

    // Nothing else to do: an inventory item with no action, or a room object that is
    // only text or observations, opens the examine view (sprite at twice its room size, name, text).
    // Readable text, observationDisplay "gameDisplay", onInteract, keys and takeable
    // room objects keep their own handling (examine.js shouldExamine).
    if (shouldExamine(data, { inInventory: isInventoryItem, resolvedText, resolvedObservations })) {
        if (startExamine(sprite, { observations: resolvedObservations, text: resolvedText })) return;
    }

    // Show observation — use observationDisplay or onInteract.display (deprecated)
    if (!data.takeable || (data.observations && !data.takeable)) {
        const displayMode = data.observationDisplay || data.onInteract?.display;
        if (displayMode === 'gameDisplay' && window.gameDisplay) {
            window.gameDisplay(message, data.name);
        } else {
            window.gameAlert(message, 'info', data.name, 5000);
        }
    }
}

// Handle container item interactions
function handleContainerInteraction(sprite) {
    const data = sprite.scenarioData;
    console.log('Handling container interaction:', data);
    
    // Check if container has contents
    if (!data.contents || data.contents.length === 0) {
        window.gameAlert(`${data.name} is empty.`, 'info', 'Empty Container', 3000);
        return;
    }
    
    // Start the container minigame
    if (window.startContainerMinigame) {
        window.startContainerMinigame(sprite, data.contents, data.takeable);
    } else {
        console.error('Container minigame not available');
        window.gameAlert('Container minigame not available', 'error', 'Error', 3000);
    }
}

// Try to interact with the nearest interactable object within range.
// Cone priority: items inside the player's facing cone are preferred over items outside it.
// If the best candidate is outside the cone the player turns to face it before interacting,
// so every highlighted (in-range) item is always reachable with E.
export function tryInteractWithNearest() {
    const player = window.player;
    if (!player) return;

    const px = player.x;
    const py = player.y;

    // Determine the player's facing angle
    // Phaser canvas coords: right=0°, down=90°, left=180°, up=270°
    const playerDirection = player.direction || 'down';
    const ANGLE_TOLERANCE = 70; // used to decide whether to turn before interacting
    let facingAngle;
    switch (playerDirection) {
        case 'right':      facingAngle = 0;   break;
        case 'down-right': facingAngle = 45;  break;
        case 'down':       facingAngle = 90;  break;
        case 'down-left':  facingAngle = 135; break;
        case 'left':       facingAngle = 180; break;
        case 'up-left':    facingAngle = 225; break;
        case 'up':         facingAngle = 270; break;
        case 'up-right':   facingAngle = 315; break;
        default:           facingAngle = 90;  break;
    }

    function angularDiff(objX, objY) {
        let angle = Math.atan2(objY - py, objX - px) * 180 / Math.PI;
        angle = (angle + 360) % 360;
        let diff = Math.abs(facingAngle - angle);
        if (diff > 180) diff = 360 - diff;
        return diff;
    }

    // All in-range items are candidates. Score = angular closeness (primary) + distance (tiebreaker).
    // No hard cone cutoff — avoids false negatives caused by fake-perspective coordinate mismatches.
    let best = null;
    let bestScore = Infinity;

    function consider(objX, objY, handleFn, rangeSq = INTERACTION_RANGE_SQ, npcSprite = null) {
        const dx = objX - px;
        const dy = objY - py;
        const plainSq = dx * dx + dy * dy;
        const distSq = npcSprite ? npcReachDistSq(player, npcSprite, plainSq) : plainSq;
        if (distSq > rangeSq) return;
        const dist = Math.sqrt(distSq);
        const score = angularDiff(objX, objY) * 1000 + dist;
        if (score < bestScore) { bestScore = score; best = { objX, objY, handleFn }; }
    }

    // E/W side doors are centered on their tile but the player stands at floor level (tile bottom).
    // Anchor to the floor of the tile and use a larger range to compensate for the vertical offset.
    const SIDE_DOOR_RANGE_SQ = INTERACTION_RANGE_SQ * 4; // 2× radius
    const SIDE_DOOR_Y_OFFSET = INTERACTION_RANGE / 2;    // half-tile down to floor level

    Object.values(rooms).forEach(room => {
        if (room.objects) {
            Object.values(room.objects).forEach(obj => {
                if (!obj.active || !obj.interactable || !obj.visible) return;
                consider(obj.x, obj.y, () => handleObjectInteraction(obj));
            });
        }

        if (room.doorSprites) {
            Object.values(room.doorSprites).forEach(door => {
                if (!door.active || !door.doorProperties) return;
                const dir = door.doorProperties.direction;
                if (dir === 'east' || dir === 'west') {
                    consider(door.x, door.y + SIDE_DOOR_Y_OFFSET, () => handleDoorInteraction(door), SIDE_DOOR_RANGE_SQ);
                } else {
                    consider(door.x, door.y, () => handleDoorInteraction(door));
                }
            });
        }

        if (room.npcSprites) {
            room.npcSprites.forEach(sprite => {
                if (!sprite.active || !sprite._isNPC || !sprite.visible) return;
                if (sprite.npcId && window.npcHostileSystem && window.npcHostileSystem.isNPCKO(sprite.npcId)) return;
                consider(sprite.x, sprite.y, () => tryInteractWithNPC(sprite), INTERACTION_RANGE_SQ, sprite);
            });
        }
    });

    if (!best) return;

    // If the best item is not roughly in the facing direction, turn toward it before interacting
    if (angularDiff(best.objX, best.objY) > ANGLE_TOLERANCE) {
        facePlayerToward(best.objX, best.objY);
    }

    const chosen = best;

    // Notify tutorial
    if (window.getTutorialManager) {
        window.getTutorialManager().notifyPlayerInteracted();
    }

    chosen.handleFn();
}

// Handle NPC interaction by sprite reference
export function tryInteractWithNPC(npcSprite) {
    if (!npcSprite || !npcSprite._isNPC) {
        return false;
    }

    const player = window.player;
    if (!player) {
        return false;
    }

    // Check if NPC is within interaction range of the player
    const distanceSq = npcReachDistSq(player, npcSprite, getInteractionDistance(player, npcSprite.x, npcSprite.y));
    const distance = Math.sqrt(distanceSq);

    // Only interact if within range
    if (distance <= INTERACTION_RANGE) {
        // Check if NPC is hostile - if so, trigger punch instead of conversation
        const npcId = npcSprite.npcId;
        if (npcId && window.npcHostileSystem && window.npcHostileSystem.isNPCHostile(npcId)) {
            // Hostile NPC - punch instead of talk
            if (window.playerCombat) {
                window.playerCombat.punch();
            }
            return true;
        }

        // Normal NPC interaction (conversation)
        handleObjectInteraction(npcSprite);
        return true; // Interaction successful
    }

    // Out of range - caller should handle movement
    return false;
}

// Simple range check for click-based interactions (no direction offset).
// Returns true if the given sprite is within INTERACTION_RANGE of the player centre.
export function isObjectInInteractionRange(sprite) {
    const player = window.player;
    if (!player || !sprite) return false;
    const dx = sprite.x - player.x;
    const dy = sprite.y - player.y;
    const distSq = dx * dx + dy * dy;
    return (sprite._isNPC ? npcReachDistSq(player, sprite, distSq) : distSq) <= INTERACTION_RANGE_SQ;
}

// Export for global access
window.checkObjectInteractions = checkObjectInteractions;
window.handleObjectInteraction = handleObjectInteraction;
window.handleContainerInteraction = handleContainerInteraction;
window.tryInteractWithNearest = tryInteractWithNearest;
window.tryInteractWithNPC = tryInteractWithNPC;
window.isObjectInInteractionRange = isObjectInInteractionRange;
