/**
 * MINIGAME STARTERS
 * =================
 * 
 * Functions to initialize and start various minigames (lockpicking, key selection).
 * These are wrappers around the MinigameFramework that handle setup and callbacks.
 */

import { generateKeyCutsForLock, doesKeyMatchLock, PREDEFINED_LOCK_CONFIGS } from './key-lock-system.js';
import KeyCutCalculator from '../utils/key-cut-calculator.js';
import { catchLockpickInView } from './lockpick-catch.js';

// Maps Phaser texture keys to their actual filenames (where key !== filename stem)
const TEXTURE_KEY_TO_FILE = {
    'safe':         'safe1',
    'pc':           'pc1',
    'notes':        'notes1',
    'phone':        'phone1',
    'suitcase':     'suitcase-1',
    'photo':        'picture1',
    'book':         'book1',
    'fingerprint':  'fingerprint_small',
    'spoofing_kit': 'office-misc-headphones',
};

function resolveObjectImageUrl(textureKey) {
    if (!textureKey) return null;
    const file = TEXTURE_KEY_TO_FILE[textureKey] || textureKey;
    return `/break_escape/assets/objects/${file}.png`;
}

export function startLockpickingMinigame(lockable, scene, difficulty = 'medium', callback, keyPins = null) {
    console.log('🎮 startLockpickingMinigame called with:', {
        keyPinsParam: keyPins,
        difficulty: difficulty,
        lockable: lockable?.name || lockable?.scenarioData?.name || 'unknown',
        hasDoorProperties: !!lockable?.doorProperties,
        hasScenarioData: !!lockable?.scenarioData
    });
    
    // If keyPins not provided as parameter, try to extract from lockable object
    if (!keyPins) {
        if (lockable?.doorProperties?.keyPins || lockable?.doorProperties?.key_pins) {
            keyPins = lockable.doorProperties.keyPins || lockable.doorProperties.key_pins;
            console.log('✓ Extracted keyPins from door properties:', keyPins);
        } else if (lockable?.scenarioData?.keyPins || lockable?.scenarioData?.key_pins) {
            keyPins = lockable.scenarioData.keyPins || lockable.scenarioData.key_pins;
            console.log('✓ Extracted keyPins from scenarioData:', keyPins);
        } else if (lockable?.keyPins || lockable?.key_pins) {
            keyPins = lockable.keyPins || lockable.key_pins;
            console.log('✓ Extracted keyPins from lockable property:', keyPins);
        } else {
            console.warn('⚠ No keyPins found in lockable object - will use random pins');
        }
    } else {
        console.log('✓ Using keyPins passed as parameter:', keyPins);
    }
    
    console.log('🎮 Starting lockpicking minigame with difficulty:', difficulty, 'keyPins:', keyPins);

    
    // Initialize the minigame framework if not already done
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        // Fallback to simple version
        window.gameAlert('Advanced lockpicking unavailable. Using simple pick attempt.', 'warning', 'Lockpicking', 2000);
        
        const success = Math.random() < 0.6; // 60% chance
        setTimeout(() => {
            if (success) {
                window.gameAlert('Successfully picked the lock!', 'success', 'Lock Picked', 2000);
                callback(true);
            } else {
                window.gameAlert('Failed to pick the lock.', 'error', 'Pick Failed', 2000);
                callback(false);
            }
        }, 1000);
        return;
    }
    
    // Use the advanced minigame framework
    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(scene);
    }
    
    // Extract item information from lockable object (handles both items and doors)
    let itemName, itemImage, itemObservations;
    
    // Check if this is a door (has doorProperties) or an item
    if (lockable?.doorProperties) {
        // This is a door - get the connected room name
        const connectedRoomId = lockable.doorProperties.connectedRoom;
        const currentRoomId = lockable.doorProperties.roomId;
        const gameScenario = window.gameScenario;
        const connectedRoom = gameScenario?.rooms?.[connectedRoomId];
        const currentRoom = gameScenario?.rooms?.[currentRoomId];
        const isLocked = lockable.doorProperties.locked;
        
        // Use door_sign if available (player-visible sign on the door)
        const doorSignOrName = connectedRoom?.door_sign || connectedRoom?.name;
        
        // Format item name with locked status
        if (doorSignOrName) {
            // Has door_sign or room name - show it
            itemName = isLocked ? `Locked ${doorSignOrName}` : doorSignOrName;
            itemObservations = `Door to ${doorSignOrName}`;
        } else {
            // No door_sign and undiscovered room - use generic names
            itemName = 'Locked door';
            const currentRoomName = currentRoom?.name || currentRoomId;
            itemObservations = `A door leading out of ${currentRoomName}`;
        }
        
        itemImage = '/break_escape/assets/tiles/door.png'; // Use default door image
    } else {
        // This is a regular item - use scenarioData
        itemName = lockable?.scenarioData?.name || lockable?.name || 'Locked Item';
        itemImage = resolveObjectImageUrl(lockable?.texture?.key);
        itemObservations = lockable?.scenarioData?.observations || '';
    }

    // Start the lockpicking minigame (Phaser version)
    window.MinigameFramework.startMinigame('lockpicking', null, {
        lockable: lockable,
        difficulty: difficulty,
        predefinedPinHeights: keyPins,  // Pass scenario keyPins as predefinedPinHeights
        itemName: itemName,
        itemImage: itemImage,
        itemObservations: itemObservations,
        cancelText: 'Close',
        canSwitchToKeyMode: window.inventory.items.some(item => 
            item && item.scenarioData && 
            item.scenarioData.type === 'key'
        ),
        availableKeys: (() => {
            // Collect all available keys for mode switching
            const keys = [];
            
            // Individual keys
            const individualKeys = window.inventory.items.filter(item => 
                item && item.scenarioData && 
                item.scenarioData.type === 'key'
            );
            individualKeys.forEach(key => {
                let cuts = key.scenarioData.cuts;
                
                // KEYPIN TO CUT CONVERSION (for available keys):
                // If no cuts but keyPins exists, generate cuts from the lock configuration.
                // keyPins on a key = the lock configuration this key opens (in pixel units: 25-65)
                if (!cuts && (key.scenarioData.keyPins || key.keyPins)) {
                    const lockKeyPins = key.scenarioData.keyPins || key.keyPins;
                    console.log(`Generating cuts from lock keyPins for available key "${key.scenarioData.name}":`, lockKeyPins);
                    
                    // Convert lock pin lengths to key cut depths using utility
                    cuts = KeyCutCalculator.calculateCutDepthsRounded(lockKeyPins);
                    
                    console.log(`Generated cuts for key "${key.scenarioData.name}":`, cuts);
                }
                
                keys.push({
                    id: window.lockRef(key.scenarioData),
                    name: key.scenarioData.name,
                    cuts: cuts || []
                });
            });
            
            // Keys from key ring
            const keyRingItem = window.inventory.items.find(item => 
                item && item.scenarioData && 
                item.scenarioData.type === 'key_ring'
            );
            if (keyRingItem && keyRingItem.scenarioData.allKeys) {
                keyRingItem.scenarioData.allKeys.forEach(keyData => {
                    let cuts = keyData.cuts;
                    
                    // KEYPIN TO CUT CONVERSION (for key ring keys):
                    // Convert keyPins to cuts using KeyCutCalculator utility
                    if (!cuts && keyData.keyPins) {
                        const lockKeyPins = keyData.keyPins;
                        console.log(`Generating cuts from lock keyPins for key ring key "${keyData.name}":`, lockKeyPins);
                        cuts = KeyCutCalculator.calculateCutDepthsRounded(lockKeyPins);
                        
                        console.log(`Generated cuts for key ring key "${keyData.name}":`, cuts);
                    }
                    
                    keys.push({
                        id: window.lockRef(keyData),
                        name: keyData.name,
                        cuts: cuts || []
                    });
                });
            }
            
            return keys.length > 0 ? keys : null;
        })(),
        onComplete: (success, result) => {
            if (success) {
                console.log('LOCKPICK SUCCESS');
                window.gameAlert('Successfully picked the lock!', 'success', 'Lockpicking', 4000);
                callback(true);
            } else {
                console.log('LOCKPICK FAILED');
                // Closed because the player was hit (player-damage-interrupt.js): that
                // shows its own notice, so no "failed" toast on top of it.
                if (!window.minigameClosedByDamage?.()) {
                    window.gameAlert('Failed to pick the lock.', 'error', 'Lockpicking', 4000);
                }
                callback(false);
            }
        }
    });
}

export function startKeySelectionMinigame(lockable, type, playerKeys, requiredKeyId, unlockTargetCallback) {
    console.log('Starting key selection minigame', { playerKeys, requiredKeyId });
    
    // Initialize the minigame framework if not already done
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        // Fallback to simple key selection
        const correctKey = playerKeys.find(key => window.lockRef(key.scenarioData) === requiredKeyId);
        if (correctKey) {
            window.gameAlert(`You used the ${correctKey.scenarioData.name} to unlock the ${type}.`, 'success', 'Unlock Successful', 4000);
            if (unlockTargetCallback) {
                unlockTargetCallback(lockable, type, lockable.layer);
            }
        } else {
            window.gameAlert('None of your keys work with this lock.', 'error', 'Wrong Keys', 4000);
        }
        return;
    }
    
    // Use the advanced minigame framework
    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }
    
    // Determine the lock ID for this lockable based on scenario data
    let lockId = null;
    
    // Try to find the lock ID from the scenario data
    if (lockable.scenarioData?.requires) {
        // This is a key lock, find which key it requires
        const requiredKeyId = lockable.scenarioData.requires;
        
        // Find the mapping for this key to get the lock ID
        if (window.keyLockMappings && window.keyLockMappings[requiredKeyId]) {
            lockId = window.keyLockMappings[requiredKeyId].lockId;
            console.log(`Found lock ID "${lockId}" for key "${requiredKeyId}"`);
        }
    }
    
    // Fallback to default lock ID
    if (!lockId) {
        lockId = lockable.scenarioData?.lockId || lockable.id || 'default_lock';
        console.log(`Using fallback lock ID "${lockId}"`);
    }
    
    // Find the key that matches this lock
    const matchingKey = playerKeys.find(key => doesKeyMatchLock(window.lockRef(key.scenarioData), lockId));
    
    let keysToShow = playerKeys;
    if (matchingKey) {
        console.log(`Found matching key "${matchingKey.scenarioData.name}" for lock "${lockId}"`);
        // For now, show all keys so player has to figure out which one works
        // In the future, you could show only the matching key or give hints
    } else {
        console.log(`No matching key found for lock "${lockId}", showing all keys`);
    }
    
    // Convert inventory keys to the format expected by the minigame
    const inventoryKeys = keysToShow.map(key => {
        // Generate cuts data if not present
        let cuts = key.scenarioData.cuts;
        
        // KEYPIN TO CUT CONVERSION:
        // ==========================
        // If no cuts but keyPins exists, we need to generate cuts from the lock configuration.
        // 
        // Remember: keyPins on a KEY represent the LOCK configuration this key is designed to open.
        // The keyPins values are in pixel units (25-65 range).
        // 
        // We convert keyPins (lock pin lengths) to cuts (key blade notch depths) using the formula:
        // cutDepth = keyPinLength + 8px (for the curved bottom of the pin)
        // 
        // This ensures when the key is inserted, each pin rests on its corresponding cut.
        if (!cuts && (key.scenarioData.keyPins || key.keyPins)) {
            const lockKeyPins = key.scenarioData.keyPins || key.keyPins;
            console.log(`Generating cuts from lock keyPins for key "${key.scenarioData.name}":`, lockKeyPins);
            
            // Generate cuts that match this lock configuration using utility
            cuts = KeyCutCalculator.calculateCutDepthsRounded(lockKeyPins);
            
            console.log(`Generated cuts for key "${key.scenarioData.name}":`, cuts);
        }
        
        // If still no cuts, generate from lock configuration
        if (!cuts) {
            // Generate cuts that match the lock's pin configuration
            cuts = generateKeyCutsForLock(key, lockable);
        }
        
        return {
            id: window.lockRef(key.scenarioData),
            name: key.scenarioData.name,
            cuts: cuts,
            pinCount: cuts.length || key.scenarioData.pinCount || 4, // Use cuts length or default to 4 pins
            matchesLock: doesKeyMatchLock(window.lockRef(key.scenarioData), lockId) // Add flag for matching
        };
    });
    
    // Determine which lock configuration to use for this lockable
    // CHANGED: Now get keyPins from scenario instead of predefined configurations
    let lockConfig = null;
    let scenarioKeyPins = null;
    let scenarioDifficulty = null;
    
    // First, try to get keyPins from the lockable's scenario data
    if (lockable?.doorProperties?.keyPins) {
        // This is a door - get keyPins from door properties
        scenarioKeyPins = lockable.doorProperties.keyPins;
        scenarioDifficulty = lockable.doorProperties.difficulty;
        console.log(`✓ Using keyPins from door properties:`, scenarioKeyPins);
    } else if (lockable?.scenarioData?.keyPins) {
        // This is an item - get keyPins from scenario data
        scenarioKeyPins = lockable.scenarioData.keyPins;
        scenarioDifficulty = lockable.scenarioData.difficulty;
        console.log(`✓ Using keyPins from item scenarioData:`, scenarioKeyPins);
    } else if (lockable?.keyPins) {
        // Fallback: keyPins might be stored directly on the object
        scenarioKeyPins = lockable.keyPins;
        scenarioDifficulty = lockable.difficulty;
        console.log(`✓ Using keyPins from lockable object:`, scenarioKeyPins);
    }
    
    // If we have scenario keyPins, use them to build the lock config
    if (scenarioKeyPins && Array.isArray(scenarioKeyPins)) {
        lockConfig = {
            id: lockId,
            pinCount: scenarioKeyPins.length,
            pinHeights: scenarioKeyPins,
            difficulty: scenarioDifficulty || 'medium'
        };
        console.log(`Created lock configuration from scenario keyPins:`, lockConfig);
    } else {
        // Fallback to predefined configurations if no scenario keyPins found
        if (PREDEFINED_LOCK_CONFIGS[lockId]) {
            lockConfig = PREDEFINED_LOCK_CONFIGS[lockId];
            console.log(`Falling back to predefined lock configuration for ${lockId}:`, lockConfig);
        } else {
            // Final fallback to default configuration
            lockConfig = {
                id: lockId,
                pinCount: 4,
                pinHeights: [30, 28, 32, 29],
                difficulty: 'medium'
            };
            console.log(`Using default lock configuration for ${lockId}:`, lockConfig);
        }
    }
    
    // Extract item information from lockable object (handles both items and doors)
    let itemName, itemImage, itemObservations;
    
    // Check if this is a door (has doorProperties) or an item
    if (lockable?.doorProperties) {
        // This is a door - get the connected room name
        const connectedRoomId = lockable.doorProperties.connectedRoom;
        const currentRoomId = lockable.doorProperties.roomId;
        const gameScenario = window.gameScenario;
        const connectedRoom = gameScenario?.rooms?.[connectedRoomId];
        const currentRoom = gameScenario?.rooms?.[currentRoomId];
        const isLocked = lockable.doorProperties.locked;
        
        // Use door_sign if available (player-visible sign on the door)
        const doorSignOrName = connectedRoom?.door_sign || connectedRoom?.name;
        
        // Format item name with locked status
        if (doorSignOrName) {
            // Has door_sign or room name - show it
            itemName = isLocked ? `${doorSignOrName}` : doorSignOrName;
            itemObservations = `Door to ${doorSignOrName}`;
        } else {
            // No door_sign and undiscovered room - use generic names
            itemName = 'Locked door';
            const currentRoomName = currentRoom?.name || currentRoomId;
            itemObservations = `A door leading out of ${currentRoomName}`;
        }
        
        itemImage = '/break_escape/assets/tiles/door.png'; // Use default door image
    } else {
        // This is a regular item - use scenarioData
        itemName = lockable?.scenarioData?.name || lockable?.name || 'Locked Item';
        itemImage = resolveObjectImageUrl(lockable?.texture?.key);
        itemObservations = lockable?.scenarioData?.observations || '';
    }

    // Start the key selection minigame
    window.MinigameFramework.startMinigame('lockpicking', null, {
        keyMode: true,
        skipStartingKey: true,
        lockable: lockable,
        lockId: lockId,
        pinCount: lockConfig.pinCount,
        predefinedPinHeights: lockConfig.pinHeights, // Pass the predefined pin heights
        difficulty: lockConfig.difficulty,
        itemName: itemName,
        itemImage: itemImage,
        itemObservations: itemObservations,
        cancelText: 'Close',
        canSwitchToPickMode: window.inventory.items.some(item => 
            item && item.scenarioData && 
            item.scenarioData.type === 'lockpick'
        ),
        inventoryKeys: keysToShow,
        requiredKeyId: requiredKeyId,
        // "Switch to Lockpicking" runs the same watcher gate as the direct pick path.
        // Caught: close this minigame quietly, then the NPC's conversation opens.
        beforeSwitchToPickMode: () => !!catchLockpickInView(lockable, {
            beforeEmit: () => {
                const mg = window.MinigameFramework?.currentMinigame;
                if (mg) {
                    mg.gameResult = { caughtLockpicking: true };
                    mg.complete(false);
                }
            }
        }),
        onComplete: (success, result) => {
            if (success) {
                // Detect which mode completed the unlock while currentMinigame is still live.
                // keyMode is true  → player used a physical key
                // keyMode is false → player switched to and completed lockpick mode
                const keyMode = window.MinigameFramework?.currentMinigame?.keyMode;
                const unlockMethod = keyMode === false ? 'lockpick' : 'key';
                console.log(`🔓 KEY SELECTION SUCCESS via method='${unlockMethod}' (keyMode=${keyMode})`);
                const successMsg = unlockMethod === 'lockpick'
                    ? 'Successfully picked the lock!'
                    : 'Successfully unlocked with the correct key!';
                window.gameAlert(successMsg, 'success', 'Unlock Successful', 4000);
                // Small delay to ensure minigame cleanup completes before room loading
                if (unlockTargetCallback) {
                    setTimeout(() => {
                        unlockTargetCallback(lockable, type, lockable.layer, unlockMethod);
                    }, 100);
                }
            } else if (result?.caughtLockpicking) {
                console.log('KEY SELECTION CLOSED: caught switching to lockpicking');
            } else {
                console.log('KEY SELECTION FAILED');
                // Closed because the player was hit: no "wrong key" on top of it (F2).
                if (!window.minigameClosedByDamage?.()) {
                    window.gameAlert('The selected key doesn\'t work with this lock.', 'error', 'Wrong Key', 4000);
                }
            }
        }
    });
    
    // Start with key selection using inventory keys
    // Wait for the minigame to be fully initialized and lock configuration to be saved
    setTimeout(() => {
        if (window.MinigameFramework.currentMinigame && window.MinigameFramework.currentMinigame.startWithKeySelection) {
            // DEFERRED KEY PREPARATION:
            // Regenerate keys after minigame initialization to ensure lock config is saved
            const updatedInventoryKeys = playerKeys.map(key => {
                let cuts = key.scenarioData.cuts;
                
                // KEYPIN TO CUT CONVERSION (deferred update):
                // Convert keyPins to cuts for visualization using utility
                // This ensures each key displays its actual unique cut pattern
                if (!cuts && (key.scenarioData.keyPins || key.keyPins)) {
                    const lockKeyPins = key.scenarioData.keyPins || key.keyPins;
                    console.log(`Generating cuts from lock keyPins for key "${key.scenarioData.name}":`, lockKeyPins);
                    cuts = KeyCutCalculator.calculateCutDepthsRounded(lockKeyPins);
                    
                    console.log(`Generated cuts for key "${key.scenarioData.name}":`, cuts);
                }
                
                // If still no cuts, generate from lock configuration
                if (!cuts) {
                    cuts = generateKeyCutsForLock(key, lockable);
                }
                
                return {
                    id: window.lockRef(key.scenarioData),
                    name: key.scenarioData.name,
                    cuts: cuts,
                    pinCount: cuts.length || key.scenarioData.pinCount || 4
                };
            });
            
            window.MinigameFramework.currentMinigame.startWithKeySelection(updatedInventoryKeys, requiredKeyId);
        }
    }, 500);
}

export function startPinMinigame(lockable, type, correctPin, callback) {
    console.log('Starting PIN minigame for', type, 'with PIN:', correctPin);
    
    // Initialize the minigame framework if not already done
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        // Fallback to simple prompt
        const pinInput = prompt(`Enter PIN code:`);
        if (pinInput === correctPin) {
            console.log('PIN SUCCESS (fallback)');
            window.gameAlert(`Correct PIN! The ${type} is now unlocked.`, 'success', 'PIN Accepted', 4000);
            callback(true);
        } else if (pinInput !== null) {
            console.log('PIN FAIL (fallback)');
            window.gameAlert("Incorrect PIN code.", 'error', 'PIN Rejected', 3000);
            callback(false);
        }
        return;
    }
    
    // Use the advanced minigame framework
    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }
    
    // Check if we have a pin-cracker in inventory
    const hasPinCracker = window.inventory.items.some(item => 
        item && item.scenarioData && 
        item.scenarioData.type === 'pin-cracker'
    );
    
    console.log('PIN-CRACKER CHECK:', hasPinCracker);
    
    // Start the PIN minigame
    window.MinigameFramework.startMinigame('pin', null, {
        title: `Enter PIN for ${type}`,
        correctPin: correctPin,
        maxAttempts: 3,
        pinLength: correctPin ? correctPin.length : 4, // Default to 4 if null (server-side validation)
        hasPinCracker: hasPinCracker,
        allowBackspace: true,
        lockable: lockable,
        type: type, // Pass type for server validation
        onComplete: (success, result) => {
            if (success) {
                console.log('PIN MINIGAME SUCCESS');
                window.gameAlert(`Correct PIN! The ${type} is now unlocked.`, 'success', 'PIN Accepted', 4000);
                callback(true, result); // Pass result with serverResponse
            } else {
                console.log('PIN MINIGAME FAILED');
                if (!window.minigameClosedByDamage?.()) {
                    window.gameAlert("Failed to enter correct PIN.", 'error', 'PIN Rejected', 3000);
                }
                callback(false, result);
            }
        }
    });
}

export function startPasswordMinigame(lockable, type, correctPassword, callback, options = {}) {
    console.log('Starting password minigame for', type, 'with password:', correctPassword);
    
    // Initialize the minigame framework if not already done
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        // Fallback to simple prompt
        const passwordInput = prompt(`Enter password:`);
        if (passwordInput === correctPassword) {
            console.log('PASSWORD SUCCESS (fallback)');
            window.gameAlert(`Correct password! The ${type} is now unlocked.`, 'success', 'Password Accepted', 4000);
            callback(true);
        } else if (passwordInput !== null) {
            console.log('PASSWORD FAIL (fallback)');
            window.gameAlert("Incorrect password.", 'error', 'Password Rejected', 3000);
            callback(false);
        }
        return;
    }
    
    // Use the advanced minigame framework
    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }
    
    // Start the password minigame
    window.MinigameFramework.startMinigame('password', null, {
        title: `Enter password for ${type}`,
        password: correctPassword,
        passwordHint: options.passwordHint || '',
        showHint: options.showHint || false,
        showKeyboard: options.showKeyboard || false,
        maxAttempts: options.maxAttempts || 3,
        postitNote: options.postitNote || '',
        showPostit: options.showPostit || false,
        lockable: lockable,
        type: type, // Pass type for server validation
        requiresKeyboardInput: true, // Password minigame needs keyboard for text input
        onComplete: (success, result) => {
            if (success) {
                console.log('PASSWORD MINIGAME SUCCESS');
                window.gameAlert(`Correct password! The ${type} is now unlocked.`, 'success', 'Password Accepted', 4000);
                callback(true, result); // Pass result with serverResponse
            } else {
                console.log('PASSWORD MINIGAME FAILED');
                if (!window.minigameClosedByDamage?.()) {
                    window.gameAlert("Failed to enter correct password.", 'error', 'Password Rejected', 3000);
                }
                callback(false, result);
            }
        }
    });
}

export function startRansomwareDisplayMinigame(lockable, type, options = {}) {
    console.log('Starting ransomware display minigame for', type, { lockable, options });

    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        return;
    }

    const ransomwareDeployed = !!window.gameState?.globalVariables?.ransomware_deployed;
    if (!ransomwareDeployed) {
        console.log('Ransomware display launch skipped: ransomware_deployed is false');
        window.gameAlert('Workstation is currently operational.', 'info', 'System Status', 2500);
        return;
    }

    if (!window.MinigameFramework.mainGameScene) {
        const scene = lockable?.scene || window.game || null;
        window.MinigameFramework.init(scene);
    }

    window.MinigameFramework.startMinigame('ransomware-display', null, {
        title: options.title || 'Ransomware Impact Display',
        lockable: lockable,
        type: type,
        cancelText: options.cancelText || 'Close',
        onComplete: (success, result) => {
            console.log('Ransomware display minigame completed:', { success, result });
            if (typeof options.onComplete === 'function') {
                options.onComplete(success, result);
            }
        }
    });
}

export function startSiemMinigame(lockable, callback, options = {}) {
    console.log('Starting SIEM minigame', { lockable, options });

    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        window.gameAlert('SIEM minigame unavailable.', 'error', 'Error', 3000);
        if (callback) callback(false, { reason: 'framework_unavailable' });
        return;
    }

    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }

    const scenarioData = lockable?.scenarioData?.minigameData || {};
    const params = {
        title: 'SIEM Dashboard',
        lockable,
        showCancel: true,
        cancelText: 'Close Console',
        timeLimitSec: options.timeLimitSec || scenarioData.timeLimitSec,
        onComplete: (success, result) => {
            if (result?.aborted) {
                callback?.(false, result);
                return;
            }
            callback?.(success, result);
        }
    };

    window.MinigameFramework.startMinigame('siem-dashboard', null, params);
}


export function startEhrTerminalMinigame(lockable, options = {}) {
    console.log('Starting EHR terminal minigame', { lockable, options });

    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        window.gameAlert('EHR terminal unavailable.', 'error', 'Error', 3000);
        return;
    }

    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }

    const scenarioData = lockable?.scenarioData?.minigameData || {};
    const params = {
        title: scenarioData.name || lockable?.name || 'EHR Prescribing Terminal',
        lockable,
        customMessage: scenarioData.customMessage,
        cancelText: options.cancelText || 'Close Terminal',
        onComplete: (success, result) => {
            if (typeof options.onComplete === 'function') {
                options.onComplete(success, result);
            }
        }
    };

    window.MinigameFramework.startMinigame('ehr-terminal', null, params);
}

export function startEsdPushbuttonMinigame(lockable, options = {}) {
    console.log('Starting ESD pushbutton minigame', { lockable, options });

    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        window.gameAlert('ESD control unavailable.', 'error', 'Error', 3000);
        options.onComplete?.(false, { reason: 'framework_unavailable' });
        return;
    }

    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }

    window.MinigameFramework.startMinigame('esd-pushbutton', null, {
        lockable,
        showCancel: true,
        onComplete: (success, result) => {
            options.onComplete?.(success, result);
        }
    });
}

export function startBackupRecoveryMinigame(lockable, type, callback, options = {}) {
    console.log('Starting backup recovery minigame', { lockable, type, options });

    const scenarioData = lockable?.scenarioData?.minigameData || {};
    const sources = options.sources
        || scenarioData.backupRecoverySources
        || scenarioData.backup_recovery_sources
        || scenarioData.recoverySources
        || null;

    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        window.gameAlert('Backup recovery console unavailable.', 'error', 'Error', 3000);
        callback?.(false, { reason: 'framework_unavailable' });
        return;
    }

    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }

    window.MinigameFramework.startMinigame('backup-recovery', null, {
        title: options.title || 'Backup Recovery Console',
        lockable: lockable,
        type: type,
        sources: sources,
        showCancel: true,
        cancelText: options.cancelText || 'Close Console',
        onComplete: (success, result) => {
            callback?.(success, result);
        }
    });
}

export function startCommandBoardMinigame(lockable, options = {}) {
    console.log('Starting Command Board minigame', { lockable, options });

    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        window.gameAlert('Command board unavailable.', 'error', 'Error', 3000);
        return;
    }

    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }

    window.MinigameFramework.startMinigame('command-board', null, {
        title: 'Major Incident Command Board',
        lockable,
        showCancel: false,
        requiresKeyboardInput: true,
        disableClose: options.disableClose === true
    });
}

export function startClaimsManagementSystemMinigame(lockable, options = {}) {
    console.log('Starting Claims Management System minigame', { lockable, options });

    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        window.gameAlert('Claims management terminal unavailable.', 'error', 'Error', 3000);
        return;
    }

    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }

    const scenarioData = lockable?.scenarioData || {};
    const minigameData = scenarioData.minigameData || {};

    window.MinigameFramework.startMinigame('claims-management-system', null, {
        title: options.title || minigameData.title || scenarioData.name || 'Claims Management System',
        lockable,
        sections: options.sections || minigameData.sections,
        stateWrites: options.stateWrites || minigameData.stateWrites,
        printEnabled: options.printEnabled !== undefined ? options.printEnabled : minigameData.printEnabled,
        onComplete: (success, result) => {
            if (typeof options.onComplete === 'function') {
                options.onComplete(success, result);
            }
        }
    });
}

export function startWarrantyChecklistMinigame(lockable, options = {}) {
    console.log('Starting Warranty Checklist minigame', { lockable, options });

    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        window.gameAlert('Warranty checklist unavailable.', 'error', 'Error', 3000);
        return;
    }

    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }

    const scenarioData = lockable?.scenarioData || {};
    const minigameData = scenarioData.minigameData || {};

    window.MinigameFramework.startMinigame('warranty-checklist', null, {
        title: options.title || minigameData.title || 'Warranty Compliance Checklist — MC-2023-ALBE-007',
        lockable,
        warranties: options.warranties || minigameData.warranties,
        onComplete: (success, result) => {
            if (typeof options.onComplete === 'function') {
                options.onComplete(success, result);
            }
        }
    });
}
window.startWarrantyChecklistMinigame = startWarrantyChecklistMinigame;

export function startBlockchainExplorerMinigame(lockable, options = {}) {
    console.log('Starting Blockchain Explorer minigame', { lockable, options });

    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        window.gameAlert('Chain analysis terminal unavailable.', 'error', 'Error', 3000);
        return;
    }

    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }

    const scenarioData = lockable?.scenarioData || {};
    const minigameData = scenarioData.minigameData || {};

    window.MinigameFramework.startMinigame('blockchain-explorer', null, {
        title:                options.title               || minigameData.title               || 'Chain Tracer',
        caseRef:              options.caseRef             || minigameData.caseRef             || '',
        currency:             options.currency            || minigameData.currency            || 'BTC',
        seedTransaction:      options.seedTransaction     || minigameData.seedTransaction,
        mixerFanOutThreshold: options.mixerFanOutThreshold ?? minigameData.mixerFanOutThreshold ?? 4,
        targetWalletAddress:  options.targetWalletAddress || minigameData.targetWalletAddress,
        stateWrites:          options.stateWrites         || minigameData.stateWrites         || {},
        lockable,
        onComplete: (success, result) => {
            if (typeof options.onComplete === 'function') {
                options.onComplete(success, result);
            }
        }
    });
}
window.startBlockchainExplorerMinigame = startBlockchainExplorerMinigame;

export function startShreddedDocumentMinigame(lockable, options = {}) {
    console.log('Starting Shredded Document minigame', { lockable, options });

    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        window.gameAlert('Shredded document unavailable.', 'error', 'Error', 3000);
        return;
    }

    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }

    const scenarioData = lockable?.scenarioData || {};
    const minigameData = scenarioData.minigameData || {};

    window.MinigameFramework.startMinigame('shredded-document', null, {
        title:          options.title          || minigameData.title          || scenarioData.name || 'Document Reconstruction',
        documentTitle:  options.documentTitle  || minigameData.documentTitle  || null,
        strips:         options.strips         || minigameData.strips         || [],
        allowRotation:  options.allowRotation  ?? minigameData.allowRotation  ?? false,
        successMessage: options.successMessage || minigameData.successMessage || 'Document reconstructed.',
        stateWrites:    options.stateWrites    || minigameData.stateWrites    || {},
        lockable,
        onComplete: (success, result) => {
            if (typeof options.onComplete === 'function') {
                options.onComplete(success, result);
            }
        }
    });
}
window.startShreddedDocumentMinigame = startShreddedDocumentMinigame;

// Export for global access
window.startLockpickingMinigame = startLockpickingMinigame;
window.startKeySelectionMinigame = startKeySelectionMinigame;
window.startPinMinigame = startPinMinigame;
window.startPasswordMinigame = startPasswordMinigame;
window.startRansomwareDisplayMinigame = startRansomwareDisplayMinigame;
window.startSiemMinigame = startSiemMinigame;
window.startEhrTerminalMinigame = startEhrTerminalMinigame;
window.startBackupRecoveryMinigame = startBackupRecoveryMinigame;
window.startSiemMinigame = startSiemMinigame;
window.startCommandBoardMinigame = startCommandBoardMinigame;
window.startClaimsManagementSystemMinigame = startClaimsManagementSystemMinigame;
window.startEsdPushbuttonMinigame = startEsdPushbuttonMinigame;
window.startShreddedDocumentMinigame = startShreddedDocumentMinigame;

export function startInfusionPumpMinigame(lockable, type, callback) {
    console.log('Starting infusion pump minigame for', type, { lockable });
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        window.gameAlert('Pump terminal unavailable.', 'error', 'Error', 3000);
        if (callback) callback(false, { reason: 'framework_unavailable' });
        return;
    }
    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }
    window.MinigameFramework.startMinigame('infusion-pump', null, {
        title: 'Infusion Pump Terminal',
        lockable,
        type,
        showCancel: true,
        cancelText: 'Close',
        onComplete: (success, result) => {
            if (callback) callback(success, result);
        }
    });
}
window.startInfusionPumpMinigame = startInfusionPumpMinigame;


export function startNetworkArchitectureMinigame(lockable, type, callback) {
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        if (callback) callback(false, { reason: 'framework_unavailable' });
        return;
    }
    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }
    const sd = lockable?.minigameData || lockable || {};
    window.MinigameFramework.startMinigame('network-architecture', null, {
        showCancel: true, cancelText: 'Close Diagram',
        ...sd,
        lockable,
        onComplete: (success, result) => { if (callback) callback(success, result); }
    });
}
window.startNetworkArchitectureMinigame = startNetworkArchitectureMinigame;

export function startAlarmPanelMinigame(lockable, type, callback) {
    console.log('Starting alarm panel minigame for', type, { lockable });
    if (!window.MinigameFramework) {
        if (callback) callback(false, { reason: 'framework_unavailable' });
        return;
    }
    if (!window.MinigameFramework.mainGameScene) window.MinigameFramework.init(window.game);
    window.MinigameFramework.startMinigame('alarm-panel', null, {
        title: 'Facility Alarm Panel',
        lockable, type, showCancel: true, cancelText: 'Close Panel',
        onComplete: (success, result) => { if (callback) callback(success, result); }
    });
}
window.startAlarmPanelMinigame = startAlarmPanelMinigame;

export function startForensicDataPlatformMinigame(sprite) {
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        return;
    }
    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }
    const sd = sprite?.minigameData || sprite || {};
    window.MinigameFramework.startMinigame('forensic-data-platform', null, {
        showCancel: true,
        cancelText: 'Close Terminal',
        ...sd,
        lockable: sprite,
    });
}
window.startForensicDataPlatformMinigame = startForensicDataPlatformMinigame;

export function startNcscBriefMinigame(sprite) {
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        return;
    }
    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }
    window.MinigameFramework.startMinigame('ncsc-brief', null, {
        title:      'NCSC Attribution Brief',
        showCancel: true,
        cancelText: 'Close',
        lockable: sprite
    });
}
window.startNcscBriefMinigame = startNcscBriefMinigame;

export function startDrugLibraryIntegrityMinigame(sprite) {
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        return;
    }
    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }
    window.MinigameFramework.startMinigame('drug-library-integrity', null, {
        title:      'Drug Library Integrity Terminal',
        showCancel: true,
        cancelText: 'Close',
        sprite
    });
}
window.startDrugLibraryIntegrityMinigame = startDrugLibraryIntegrityMinigame;
export function startCoverageDecisionFormMinigame(sprite) {
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        return;
    }
    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }
    window.MinigameFramework.startMinigame('coverage-decision-form', null, {
        title:      'Coverage Recommendation Form',
        showCancel: true,
        cancelText: 'Close',
        lockable: sprite
    });
}
window.startCoverageDecisionFormMinigame = startCoverageDecisionFormMinigame;

export function startCryptexMinigame(lockable, type, cryptexConfig, callback) {
    console.log('Starting cryptex password minigame', { lockable, type, cryptexConfig });

    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        window.gameAlert('Cryptex password unavailable.', 'error', 'Error', 3000);
        callback?.(false, { reason: 'framework_unavailable' });
        return;
    }

    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }

    window.MinigameFramework.startMinigame('cryptex', null, {
        title: 'Cryptex Password',
        lockable,
        type,
        cryptexConfig: cryptexConfig || {},
        showCancel: true,
        cancelText: 'Cancel',
        onComplete: (success, result) => {
            callback?.(success, result);
        }
    });
}
window.startCryptexMinigame = startCryptexMinigame;

export function startCombinationMinigame(lockable, type, combination, callback) {
    console.log('Starting combination padlock minigame', { lockable, type, combination });

    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        window.gameAlert('Combination padlock unavailable.', 'error', 'Error', 3000);
        callback?.(false, { reason: 'framework_unavailable' });
        return;
    }

    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }

    window.MinigameFramework.startMinigame('combination', null, {
        title: 'Combination Padlock',
        lockable,
        type,
        combination: combination || [0, 0, 0],
        showCancel: true,
        cancelText: 'Cancel',
        onComplete: (success, result) => {
            callback?.(success, result);
        }
    });
}
window.startCombinationMinigame = startCombinationMinigame;