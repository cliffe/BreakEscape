/**
 * UNLOCK SYSTEM
 * =============
 * 
 * Handles all unlock logic for doors and items.
 * Supports multiple lock types: key, pin, password, biometric, bluetooth.
 * This system coordinates between various subsystems to perform unlocking.
 */

import { DOOR_ALIGN_OVERLAP } from '../utils/constants.js';
// IMPORTANT: version must match all other imports of rooms.js — mismatched ?v= strings
// create separate module instances with separate rooms objects, causing state to diverge.
import { rooms } from '../core/rooms.js';
import { unlockDoor } from './doors.js';
import { startLockpickingMinigame, startKeySelectionMinigame, startPinMinigame, startPasswordMinigame, startRansomwareDisplayMinigame, startBackupRecoveryMinigame, startInfusionPumpMinigame } from './minigame-starters.js';
import { playUISound } from './ui-sounds.js';
import { startFingerprintReader } from '../minigames/biometrics/fingerprint-reader-minigame.js';

// Helper function to notify server of unlock and get room/container data
export async function notifyServerUnlock(lockable, type, method) {
    let serverResponse;
    const apiClient = window.ApiClient || window.APIClient;
    const gameId = window.breakEscapeConfig?.gameId;

    if (apiClient && gameId) {
        try {
            // Get target ID
            let targetId;
            if (type === 'door') {
                targetId = lockable.doorProperties?.connectedRoom || lockable.doorProperties?.roomId;
            } else {
                targetId = lockable.scenarioData?.id || lockable.scenarioData?.name || lockable.objectId;
            }

            console.log(`Notifying server of ${method} unlock:`, { type, targetId });
            serverResponse = await apiClient.unlock(type, targetId, null, method);

            // Populate container contents if returned
            if (serverResponse.hasContents && serverResponse.contents && lockable.scenarioData) {
                lockable.scenarioData.contents = serverResponse.contents;
            }
        } catch (error) {
            console.error(`Failed to notify server of ${method} unlock:`, error);
        }
    }

    return serverResponse;
}

// Helper function to check if two rectangles overlap
function boundsOverlap(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

export function handleUnlock(lockable, type) {
    console.log('UNLOCK ATTEMPT');
    playUISound('lock');
    
    // Check if locks are disabled for testing
    if (window.DISABLE_LOCKS) {
        console.log('LOCKS DISABLED FOR TESTING - Unlocking directly');
        unlockTarget(lockable, type, lockable.layer);
        return;
    }
    
    // Get lock requirements based on type
    const lockRequirements = type === 'door'
        ? getLockRequirementsForDoor(lockable)
        : getLockRequirementsForItem(lockable);

    // SECURITY: If no lock requirements found, item is unlocked - verify with server
    if (!lockRequirements) {
        console.log('NO LOCK REQUIREMENTS FOUND - ITEM IS UNLOCKED, VERIFYING WITH SERVER');
        notifyServerUnlock(lockable, type, 'unlocked').then(serverResponse => {
            if (serverResponse && serverResponse.success) {
                unlockTarget(lockable, type, lockable.layer, serverResponse);
            } else {
                window.gameAlert('Access denied', 'error', 'Error', 3000);
            }
        }).catch(error => {
            console.error('Server verification failed:', error);
            window.gameAlert('Failed to verify access', 'error', 'Error', 3000);
        });
        return;
    }

    // Check if object is locked based on lock requirements
    // Use 'locked' field instead of 'requires' (which is filtered server-side for security)
    const isLocked = lockRequirements.locked !== false;

    // SECURITY: If client thinks door is unlocked, verify with server
    if (!isLocked) {
        console.log('CLIENT SEES UNLOCKED - VERIFYING WITH SERVER');
        // Call server to verify and grant access
        notifyServerUnlock(lockable, type, 'unlocked').then(serverResponse => {
            if (serverResponse && serverResponse.success) {
                unlockTarget(lockable, type, lockable.layer, serverResponse);
            } else {
                window.gameAlert('Access denied', 'error', 'Error', 3000);
            }
        }).catch(error => {
            console.error('Server verification failed:', error);
            window.gameAlert('Failed to verify access', 'error', 'Error', 3000);
        });
        return;
    }
    
    // Emit unlock attempt event. This is reached only for a door that is locked, but it
    // fires before the outcome is known, so a player holding the key still triggers it.
    // Lines that should play only on a refusal use door_unlock_failed (emitDoorUnlockFailed).
    const doorAttemptData = (window.eventDispatcher && type === 'door') ? {
        roomId: (lockable.doorProperties || {}).roomId,
        connectedRoom: (lockable.doorProperties || {}).connectedRoom,
        direction: (lockable.doorProperties || {}).direction,
        lockType: lockRequirements.lockType
    } : null;
    if (doorAttemptData) {
        window.eventDispatcher.emit('door_unlock_attempt', doorAttemptData);
    }
    // Refusals that come back immediately (no minigame): tell the NPC event system.
    const emitDoorUnlockFailed = (reason) => {
        if (!doorAttemptData) return;
        const payload = { ...doorAttemptData, reason };
        window.eventDispatcher.emit('door_unlock_failed', payload);
        if (doorAttemptData.connectedRoom) {
            window.eventDispatcher.emit(`door_unlock_failed:${doorAttemptData.connectedRoom}`, payload);
        }
    };
    
    switch(lockRequirements.lockType) {
        case 'key':
            // Note: requiredKey no longer available from server (security filtered)
            // Server will validate on unlock attempt
            const requiredKey = null;  // Will be validated server-side
            console.log('KEY REQUIRED (server-side validation)');

            // Get all keys from player's inventory (including key ring)
            let playerKeys = [];
            
            // Check for individual keys
            const individualKeys = window.inventory.items.filter(item => 
                item && item.scenarioData && 
                item.scenarioData.type === 'key'
            );
            playerKeys = playerKeys.concat(individualKeys);
            
            // Check for key ring
            const keyRingItem = window.inventory.items.find(item => 
                item && item.scenarioData && 
                item.scenarioData.type === 'key_ring'
            );
            
            if (keyRingItem && keyRingItem.scenarioData.allKeys) {
                // Convert key ring keys to the format expected by the minigame
                const keyRingKeys = keyRingItem.scenarioData.allKeys.map(keyData => {
                    // Create a mock inventory item for each key in the ring
                    return {
                        scenarioData: keyData,
                        name: 'key',
                        objectId: `key_ring_${window.lockRef(keyData) || keyData.name}`
                    };
                });
                playerKeys = playerKeys.concat(keyRingKeys);
            }
            
            // Check for lockpick kit
            const hasLockpick = window.inventory.items.some(item => 
                item && item.scenarioData && 
                item.scenarioData.type === 'lockpick'
            );
            
            if (playerKeys.length > 0) {
                // Keys take priority - go straight to key selection
                console.log('KEYS AVAILABLE - STARTING KEY SELECTION');
                // Wrap unlockTarget to notify server first.
                // method is passed from the key selection minigame's onComplete:
                //   'key'      → player used a physical key from inventory
                //   'lockpick' → player switched to and completed pick mode
                const unlockWithServerNotification = async (lockable, type, layer, method = 'key') => {
                    const serverResponse = await notifyServerUnlock(lockable, type, method);
                    unlockTarget(lockable, type, layer, serverResponse);
                };
                startKeySelectionMinigame(lockable, type, playerKeys, requiredKey, unlockWithServerNotification);
            } else if (hasLockpick) {
                // Only lockpick available - launch lockpicking minigame directly
                console.log('LOCKPICK AVAILABLE - STARTING LOCKPICKING MINIGAME');
                
                // CHECK: Should any NPC interrupt with person-chat instead?
                const roomId = lockable.doorProperties?.roomId || window.currentRoomId;
                if (window.npcManager && roomId) {
                    // Get player position for LOS check
                    const playerPos = window.player?.sprite?.getCenter ? 
                      window.player.sprite.getCenter() : 
                      { x: window.player?.x || 0, y: window.player?.y || 0 };
                    
                    const interruptingNPC = window.npcManager.shouldInterruptLockpickingWithPersonChat(roomId, playerPos);
                    if (interruptingNPC) {
                        console.log(`🚫 LOCKPICKING INTERRUPTED: Triggering person-chat with NPC "${interruptingNPC.id}"`);
                        
                        // Trigger the lockpick event which will start person-chat
                        if (window.npcManager.eventDispatcher) {
                            window.npcManager.eventDispatcher.emit('lockpick_used_in_view', {
                                npcId: interruptingNPC.id,
                                roomId: roomId,
                                lockable: lockable,
                                timestamp: Date.now()
                            });
                        }
                        return;  // Don't start lockpicking minigame
                    }
                }
                
                let difficulty = lockable.doorProperties?.difficulty || lockable.scenarioData?.difficulty || lockable.properties?.difficulty || lockRequirements.difficulty || 'medium';
                // Check for both keyPins (camelCase) and key_pins (snake_case)
                let keyPins = lockable.doorProperties?.keyPins || lockable.doorProperties?.key_pins ||
                              lockable.scenarioData?.keyPins || lockable.scenarioData?.key_pins ||
                              lockable.properties?.keyPins || lockable.properties?.key_pins ||
                              lockRequirements.keyPins || lockRequirements.key_pins;
                
                console.log('🔓 Door/Item lock details:', {
                    hasDoorProperties: !!lockable.doorProperties,
                    doorKeyPins: lockable.doorProperties?.keyPins,
                    hasScenarioData: !!lockable.scenarioData,
                    scenarioKeyPins: lockable.scenarioData?.keyPins,
                    hasProperties: !!lockable.properties,
                    propertiesKeyPins: lockable.properties?.keyPins,
                    lockRequirementsKeyPins: lockRequirements.keyPins,
                    finalKeyPins: keyPins,
                    finalDifficulty: difficulty
                });
                
                startLockpickingMinigame(lockable, window.game, difficulty, async (success) => {
                    if (success) {
                        // Notify server of successful lockpick to update player_state and get room/container data
                        const serverResponse = await notifyServerUnlock(lockable, type, 'lockpick');
                        setTimeout(() => {
                            unlockTarget(lockable, type, lockable.layer, serverResponse);
                            window.gameAlert(`Successfully picked the lock!`, 'success', 'Lock Picked', 4000);
                        }, 100);
                    } else {
                        console.log('LOCKPICK FAILED');
                        window.gameAlert('Failed to pick the lock. Try again.', 'error', 'Pick Failed', 3000);
                    }
                }, keyPins);  // Pass keyPins to minigame starter
            } else {
                console.log('NO KEYS OR LOCKPICK AVAILABLE');
                emitDoorUnlockFailed('no_key');
                window.gameAlert(`Requires key`, 'error', 'Locked', 4000);
            }
            break;

        case 'cryptex':
            console.log('CRYPTEX PASSWORD REQUESTED');
            // Get cryptex config from lockable object
            const cryptexConfig = lockable.cryptexConfig || lockable.scenarioData?.cryptexConfig || {};

            startCryptexMinigame(lockable, type, cryptexConfig, (success, result) => {
                if (success) {
                    unlockTarget(lockable, type, lockable.layer, result?.serverResponse);
                }
            });
            break;
        
        case 'combination':
            console.log('COMBINATION PADLOCK REQUESTED');
            // Get combination from lockable.scenarioData.combination (array [L, R, L])
            const combination = lockable.combination || lockable.scenarioData?.combination || [0, 0, 0];

            startCombinationMinigame(lockable, type, combination, (success, result) => {
                if (success) {
                    unlockTarget(lockable, type, lockable.layer, result?.serverResponse);
                }
            });
            break;

        case 'pin':
            console.log('PIN CODE REQUESTED (server-side validation)');
            // Pass null for required code - will be validated server-side
            startPinMinigame(lockable, type, null, (success, result) => {
                if (success) {
                    unlockTarget(lockable, type, lockable.layer, result?.serverResponse);
                }
            });
            break;

        case 'password':
            console.log('PASSWORD REQUESTED (server-side validation)');

            // Get password options from the lockable object
            const passwordOptions = {
                passwordHint: lockable.passwordHint || lockable.scenarioData?.passwordHint || '',
                showHint: lockable.showHint || lockable.scenarioData?.showHint || false,
                showKeyboard: lockable.showKeyboard || lockable.scenarioData?.showKeyboard || false,
                maxAttempts: lockable.maxAttempts || lockable.scenarioData?.maxAttempts || 3,
                postitNote: lockable.postitNote || lockable.scenarioData?.postitNote || '',
                showPostit: lockable.showPostit || lockable.scenarioData?.showPostit || false
            };

            // Pass null for required password - will be validated server-side
            startPasswordMinigame(lockable, type, null, (success, result) => {
                if (success) {
                    unlockTarget(lockable, type, lockable.layer, result?.serverResponse);
                }
            }, passwordOptions);
            break;

        case 'ransomware_display':
            console.log('RANSOMWARE DISPLAY LOCK TYPE TRIGGERED');
            // Process onRead.setVariable (same pattern as interactions.js readable items)
            // This emits global_variable_changed:varName so NPC eventMappings can react.
            {
                const onRead = lockable.onRead;
                if (onRead?.setVariable && window.gameState?.globalVariables) {
                    Object.entries(onRead.setVariable).forEach(([varName, value]) => {
                        const oldValue = window.gameState.globalVariables[varName];
                        window.gameState.globalVariables[varName] = value;
                        console.log(`📖 ransomware_display onRead.setVariable: ${varName} = ${value}`);
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

                // Also complete any tasks directly listed in completesTaskOnOpen.
                // Provides a reliable fallback for manual tasks where the NPC eventMapping
                // chain may not be available (e.g., scenario has no reacting NPC).
                const completesTask = lockable.completesTaskOnOpen;
                if (completesTask && window.objectivesManager) {
                    const tasks = Array.isArray(completesTask) ? completesTask : [completesTask];
                    tasks.forEach(taskId => {
                        console.log(`📖 ransomware_display completesTaskOnOpen: ${taskId}`);
                        window.objectivesManager.completeTask(taskId);
                    });
                }
            }
            startRansomwareDisplayMinigame(lockable, type);
            break;

        case 'infusion_pump':
            startInfusionPumpMinigame(lockable, type, (success, result) => {
                if (success) unlockTarget(lockable, type, lockable.layer, result?.serverResponse);
            });
            break;

        case 'backup_recovery':
            console.log('BACKUP RECOVERY LOCK TYPE TRIGGERED');
            startBackupRecoveryMinigame(lockable, type, async (success) => {
                if (success) {
                    const serverResponse = await notifyServerUnlock(lockable, type, 'backup_recovery');
                    unlockTarget(lockable, type, lockable.layer, serverResponse);
                }
            });
            break;
            
        case 'biometric':
            // The reader overlay owns the whole check: pick a lift, then accepted / partial read /
            // no match / no prints (systems/biometric-lock.js, minigames/biometrics/).
            startFingerprintReader(lockable, type, lockRequirements, () => {
                notifyServerUnlock(lockable, type, 'biometric').then(serverResponse => {
                    unlockTarget(lockable, type, lockable.layer, serverResponse);
                });
            }, emitDoorUnlockFailed);
            break;
            
        case 'bluetooth':
            console.log('BLUETOOTH UNLOCK ATTEMPT');
            const requiredDevice = lockRequirements.requires; // MAC address or device name
            console.log('BLUETOOTH DEVICE REQUIRED', requiredDevice);
            
            // Check if we have a bluetooth scanner in inventory
            const hasScanner = window.inventory.items.some(item => 
                item && item.scenarioData && 
                item.scenarioData.type === 'bluetooth_scanner'
            );
            
            if (!hasScanner) {
                console.log('NO BLUETOOTH SCANNER');
                emitDoorUnlockFailed('no_scanner');
                window.gameAlert(`You need a Bluetooth scanner to access this ${type}.`, 'error', 'Scanner Required', 4000);
                break;
            }
            
            // Check if we have the required device in our bluetooth scan results
            const bluetoothData = window.gameState?.bluetoothDevices || [];
            const requiredDeviceData = bluetoothData.find(device => 
                device.mac === requiredDevice || device.name === requiredDevice
            );
            
            console.log('BLUETOOTH SCAN DATA', JSON.stringify(bluetoothData));
            console.log('REQUIRED DEVICE CHECK', { required: requiredDevice, found: !!requiredDeviceData });
            
            if (requiredDeviceData) {
                // Check signal strength - need to be close enough
                const minSignalStrength = lockable.minSignalStrength || -70; // dBm
                
                if (requiredDeviceData.signalStrength >= minSignalStrength) {
                    console.log('BLUETOOTH UNLOCK SUCCESS');
                    // Notify server and get room/container data
                    notifyServerUnlock(lockable, type, 'bluetooth').then(serverResponse => {
                        unlockTarget(lockable, type, lockable.layer, serverResponse);
                    });
                    window.gameAlert(`Successfully connected to ${requiredDeviceData.name} and unlocked the ${type}.`,
                        'success', 'Bluetooth Unlock Successful', 5000);
                } else {
                    console.log('BLUETOOTH SIGNAL TOO WEAK', 
                        `Signal: ${requiredDeviceData.signalStrength}dBm < Required: ${minSignalStrength}dBm`);
                    window.gameAlert(`Bluetooth device detected but signal too weak (${requiredDeviceData.signalStrength}dBm). Move closer.`,
                        'error', 'Weak Signal', 4000);
                }
            } else {
                console.log('BLUETOOTH DEVICE NOT FOUND', 
                    `Required: '${requiredDevice}', Available: ${bluetoothData.map(d => d.name || d.mac).join(", ") || "none"}`);
                window.gameAlert(`This ${type} requires connection to '${requiredDevice}', which hasn't been detected yet.`,
                    'error', 'Device Not Found', 5000);
            }
            break;

        case 'ble': {
            console.log('BLE LOCK INTERACTION');
            const hasBleScannerTool = window.inventory?.items?.some(
                item => item?.scenarioData?.type === 'ble_scanner' || item?.type === 'ble_scanner'
            );
            if (!hasBleScannerTool) {
                window.gameAlert(
                    `You need a BLE scanner to interact with this ${type}.`,
                    'error', 'Scanner Required', 4000
                );
                break;
            }
            if (window.startBleScannerMinigame) {
                window.startBleScannerMinigame(lockable, {
                    preselectTarget: lockable,
                    type,
                    onComplete: (success) => {
                        if (success) {
                            notifyServerUnlock(lockable, type, 'ble').then(serverResponse => {
                                unlockTarget(lockable, type, lockable.layer, serverResponse);
                            });
                        }
                    }
                });
            } else {
                console.error('startBleScannerMinigame not available');
            }
            break;
        }

        case 'rfid':
            console.log('RFID LOCK UNLOCK ATTEMPT');

            // Support both single card ID (legacy) and array of card IDs
            const requiredCardIds = Array.isArray(lockRequirements.requires) ?
                lockRequirements.requires : [lockRequirements.requires];

            // Check if door accepts UID-only emulation (for DESFire cards)
            const acceptsUIDOnly = lockRequirements.acceptsUIDOnly || false;

            console.log('RFID CARD REQUIRED', requiredCardIds, 'acceptsUIDOnly:', acceptsUIDOnly);

            // Check for keycards in inventory
            const keycards = window.inventory.items.filter(item =>
                item && item.scenarioData &&
                item.scenarioData.type === 'keycard'
            );

            // Helper to get card ID (standard: card_id, else the lock it opens)
            const getCardId = (cardData) => cardData.card_id || window.lockRef(cardData);

            // Find a matching physical keycard
            const matchingKeycard = keycards.find(card =>
                requiredCardIds.includes(getCardId(card.scenarioData))
            );
            const hasValidCard = !!matchingKeycard;

            // Check for RFID cloner with saved cards
            const cloner = window.inventory.items.find(item =>
                item && item.scenarioData &&
                item.scenarioData.type === 'rfid_cloner'
            );

            const hasCloner = !!cloner;
            const savedCards = cloner?.scenarioData?.saved_cards || [];

            // Check if any saved card matches
            const hasValidClone = savedCards.some(card =>
                requiredCardIds.includes(getCardId(card))
            );

            console.log('RFID CHECK', {
                requiredCardIds,
                acceptsUIDOnly,
                hasCloner,
                keycardsCount: keycards.length,
                savedCardsCount: savedCards.length,
                hasValidCard,
                hasValidClone,
                matchingKeycard: matchingKeycard?.scenarioData?.name
            });

            // PRIORITY 1: If player has a matching physical keycard, open door directly
            if (hasValidCard) {
                const cardName = matchingKeycard.scenarioData.name || 'Keycard';
                console.log(`RFID DIRECT UNLOCK with physical keycard: ${cardName}`);
                
                // Notify server and unlock
                notifyServerUnlock(lockable, type, 'rfid').then(serverResponse => {
                    // Play electric strike sound alongside door open
                    try {
                        if (window.game && window.game.sound) {
                            const s = window.game.sound.get('rfid_unlock') || window.game.sound.add('rfid_unlock');
                            s.play({ volume: 0.9 });
                        }
                    } catch (e) {}
                    unlockTarget(lockable, type, lockable.layer, serverResponse);
                    window.gameAlert(`Door opened with ${cardName}`, 'success', 'Access Granted', 3000);
                }).catch(error => {
                    console.error('RFID unlock failed:', error);
                    window.gameAlert('Access denied', 'error', 'Error', 3000);
                });
            }
            // PRIORITY 2: If player has RFID cloner, open minigame to emulate or read cards
            else if (hasCloner) {
                // Start RFID minigame in unlock mode
                window.startRFIDMinigame(lockable, type, {
                    mode: 'unlock',
                    requiredCardIds: requiredCardIds,
                    acceptsUIDOnly: acceptsUIDOnly,
                    availableCards: keycards,  // Cards they can read in the minigame
                    hasCloner: hasCloner,
                    onComplete: async (success) => {
                        if (success) {
                            // Notify server and get room/container data
                            const serverResponse = await notifyServerUnlock(lockable, type, 'rfid');
                            setTimeout(() => {
                                // Play electric strike sound alongside door open
                                try {
                                    if (window.game && window.game.sound) {
                                        const s = window.game.sound.get('rfid_unlock') || window.game.sound.add('rfid_unlock');
                                        s.play({ volume: 0.9 });
                                    }
                                } catch (e) {}
                                unlockTarget(lockable, type, lockable.layer, serverResponse);
                                window.gameAlert('RFID lock unlocked!', 'success', 'Access Granted', 3000);
                            }, 100);
                        }
                    }
                });
            }
            // PRIORITY 3: No valid keycard and no cloner
            else {
                console.log('NO RFID CARDS OR CLONER AVAILABLE');
                window.gameAlert('Requires RFID keycard', 'error', 'Access Denied', 4000);
            }
            break;

        default:
            window.gameAlert(`This ${type} requires ${lockRequirements.lockType} to unlock.`, 'info', 'Locked', 4000);
            break;
    }
}

export function getLockRequirementsForDoor(doorSprite) {
    // First, check if the door sprite has lock properties directly
    if (doorSprite.doorProperties) {
        const props = doorSprite.doorProperties;
        // Return lock requirements if door has any lock data (locked or not)
        if (props.locked !== undefined) {
            return {
                locked: props.locked,
                lockType: props.lockType,
                requires: props.requires,
                keyPins: props.keyPins,  // Include keyPins for scenario-based locks
                difficulty: props.difficulty
            };
        }
    }
    
    // Fallback: Try to find lock requirements from scenario data
    const doorWorldX = doorSprite.x;
    const doorWorldY = doorSprite.y;
    
    const overlappingRooms = [];
    Object.entries(rooms).forEach(([roomId, otherRoom]) => {
        const doorCheckArea = {
            x: doorWorldX - DOOR_ALIGN_OVERLAP,
            y: doorWorldY - DOOR_ALIGN_OVERLAP,
            width: DOOR_ALIGN_OVERLAP * 2,
            height: DOOR_ALIGN_OVERLAP * 2
        };
        
        const roomBounds = {
            x: otherRoom.position.x,
            y: otherRoom.position.y,
            width: otherRoom.map.widthInPixels,
            height: otherRoom.map.heightInPixels
        };
        
        if (boundsOverlap(doorCheckArea, roomBounds)) {
            const roomCenterX = roomBounds.x + (roomBounds.width / 2);
            const roomCenterY = roomBounds.y + (roomBounds.height / 2);
            const player = window.player;
            const distanceToPlayer = player ? Phaser.Math.Distance.Between(
                player.x, player.y,
                roomCenterX, roomCenterY
            ) : 0;
            
            const gameScenario = window.gameScenario;
            const roomData = gameScenario?.rooms?.[roomId];
            
            overlappingRooms.push({
                id: roomId,
                room: otherRoom,
                distance: distanceToPlayer,
                lockType: roomData?.lockType,
                requires: roomData?.requires,
                keyPins: roomData?.keyPins || roomData?.key_pins,  // Include keyPins from scenario (supports both cases)
                difficulty: roomData?.difficulty,
                locked: roomData?.locked
            });
        }
    });
    
    const lockedRooms = overlappingRooms
        .filter(r => r.locked)
        .sort((a, b) => b.distance - a.distance);

    if (lockedRooms.length > 0) {
        const targetRoom = lockedRooms[0];
        return {
            locked: targetRoom.locked,
            lockType: targetRoom.lockType,
            requires: targetRoom.requires,
            keyPins: targetRoom.keyPins,  // Include keyPins from scenario
            difficulty: targetRoom.difficulty
        };
    }
    
    return null;
}

export function getLockRequirementsForItem(item) {
    if (!item.scenarioData) return null;

    return {
        locked: item.scenarioData.locked,
        lockType: item.scenarioData.lockType || 'key',
        requires: item.scenarioData.requires || '',
        keyPins: item.scenarioData.keyPins,  // Include keyPins for scenario-based locks
        difficulty: item.scenarioData.difficulty
    };
}

export function unlockTarget(lockable, type, layer, serverResponse) {
    console.log('🔓 unlockTarget called:', { type, lockable, serverResponse });

    if (type === 'door') {
        // After unlocking, use the proper door unlock function
        // Pass roomData from server if available (avoids separate room API call)
        const roomData = serverResponse?.roomData;
        unlockDoor(lockable, roomData);

        // Emit door unlocked event
        console.log('🔓 Checking for eventDispatcher:', !!window.eventDispatcher);
        if (window.eventDispatcher) {
            const doorProps = lockable.doorProperties || {};
            console.log('🔓 Emitting door_unlocked event:', doorProps);
            window.eventDispatcher.emit('door_unlocked', {
                roomId: doorProps.roomId,
                connectedRoom: doorProps.connectedRoom,
                direction: doorProps.direction,
                lockType: doorProps.lockType
            });
        }
    } else {
        // Handle item unlocking
        if (lockable.scenarioData) {
            lockable.scenarioData.locked = false;
            // Set new state for containers with contents
            if (lockable.scenarioData.contents) {
                lockable.scenarioData.isUnlockedButNotCollected = true;
                
                // Clear the interaction indicator immediately since this is now unlocked
                if (lockable.interactionIndicator) {
                    // Stop any tweens on the indicator first
                    if (lockable.scene && lockable.scene.tweens) {
                        lockable.scene.tweens.killTweensOf(lockable.interactionIndicator);
                    }
                    lockable.interactionIndicator.destroy();
                    delete lockable.interactionIndicator;
                }
                
                // Emit item unlocked event
                if (window.eventDispatcher) {
                    window.eventDispatcher.emit('item_unlocked', {
                        itemId: lockable.scenarioData.id,
                        itemType: lockable.scenarioData.type,
                        itemName: lockable.scenarioData.name,
                        lockType: lockable.scenarioData.lockType
                    });
                }

                // Automatically launch container minigame after unlocking
                setTimeout(() => {
                    if (window.handleContainerInteraction) {
                        console.log('Auto-launching container minigame after unlock');
                        window.handleContainerInteraction(lockable);
                    }
                }, 500); // Small delay to ensure unlock message is shown

                return; // Return early to prevent automatic collection
            }
        } else {
            lockable.locked = false;
            if (lockable.contents) {
                lockable.isUnlockedButNotCollected = true;

                // Clear the interaction indicator immediately since this is now unlocked
                if (lockable.interactionIndicator) {
                    // Stop any tweens on the indicator first
                    if (lockable.scene && lockable.scene.tweens) {
                        lockable.scene.tweens.killTweensOf(lockable.interactionIndicator);
                    }
                    lockable.interactionIndicator.destroy();
                    delete lockable.interactionIndicator;
                }

                // Emit item unlocked event
                if (window.eventDispatcher) {
                    window.eventDispatcher.emit('item_unlocked', {
                        itemId: lockable.id,
                        itemType: lockable.type || 'unknown',
                        itemName: lockable.name,
                        lockType: lockable.lockType
                    });
                }
                
                // Automatically launch container minigame after unlocking
                setTimeout(() => {
                    if (window.handleContainerInteraction) {
                        console.log('Auto-launching container minigame after unlock');
                        window.handleContainerInteraction(lockable);
                    }
                }, 500); // Small delay to ensure unlock message is shown
                
                return; // Return early to prevent automatic collection
            }
        }
    }
    console.log(`${type} unlocked successfully`);
}

// Export for global access
window.handleUnlock = handleUnlock;
window.getLockRequirementsForDoor = getLockRequirementsForDoor;
window.getLockRequirementsForItem = getLockRequirementsForItem;
window.unlockTarget = unlockTarget;

