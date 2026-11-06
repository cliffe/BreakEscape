/**
 * KEY-LOCK SYSTEM
 * ===============
 * 
 * Manages the relationship between keys and locks in the game.
 * Each key is mapped to a specific lock based on scenario definitions.
 * This ensures consistent lock configurations and key cuts throughout the game.
 */

import KeyCutCalculator from '../utils/key-cut-calculator.js';

// Global key-lock mapping system
// This ensures each key matches exactly one lock in the game
window.keyLockMappings = window.keyLockMappings || {};

// Predefined lock configurations for the game
// Each lock has a unique ID and pin configuration
const PREDEFINED_LOCK_CONFIGS = {
    'ceo_briefcase_lock': {
        id: 'ceo_briefcase_lock',
        pinCount: 4,
        pinHeights: [32, 28, 35, 30], // Specific pin heights for CEO briefcase
        difficulty: 'medium'
    },
    'office_drawer_lock': {
        id: 'office_drawer_lock', 
        pinCount: 3,
        pinHeights: [25, 30, 28],
        difficulty: 'easy'
    },
    'server_room_lock': {
        id: 'server_room_lock',
        pinCount: 5,
        pinHeights: [40, 35, 38, 32, 36],
        difficulty: 'hard'
    },
    'storage_cabinet_lock': {
        id: 'storage_cabinet_lock',
        pinCount: 4,
        pinHeights: [29, 33, 27, 31],
        difficulty: 'medium'
    }
};

// Function to assign keys to locks based on scenario definitions
function assignKeysToLocks() {
    console.log('Assigning keys to locks based on scenario definitions...');
    
    // Get all keys from inventory (including key ring)
    let playerKeys = [];
    
    // Check for individual keys
    const individualKeys = window.inventory?.items?.filter(item => 
        item && item.scenarioData && 
        item.scenarioData.type === 'key'
    ) || [];
    playerKeys = playerKeys.concat(individualKeys);
    
    // Check for key ring
    const keyRingItem = window.inventory?.items?.find(item => 
        item && item.scenarioData && 
        item.scenarioData.type === 'key_ring'
    );
    
    if (keyRingItem && keyRingItem.scenarioData.allKeys) {
        // Convert key ring keys to the format expected by the system
        const keyRingKeys = keyRingItem.scenarioData.allKeys.map(keyData => {
            return {
                scenarioData: keyData,
                name: 'key',
                objectId: `key_ring_${window.lockRef(keyData) || keyData.name}`
            };
        });
        playerKeys = playerKeys.concat(keyRingKeys);
    }
    
    console.log(`Found ${playerKeys.length} keys in inventory`);
    
    // Get all rooms from the current scenario
    const rooms = window.gameState?.scenario?.rooms || {};
    console.log(`Found ${Object.keys(rooms).length} rooms in scenario`);
    
    // Find all locks that require keys
    const keyLocks = [];
    Object.entries(rooms).forEach(([roomId, roomData]) => {
        if (roomData.locked && roomData.lockType === 'key' && roomData.requires) {
            keyLocks.push({
                roomId: roomId,
                requiredKeyId: roomData.requires,
                roomName: roomData.type || roomId
            });
        }
        
        // Also check objects within rooms for key locks
        if (roomData.objects) {
            roomData.objects.forEach((obj, objIndex) => {
                if (obj.locked && obj.lockType === 'key' && obj.requires) {
                    keyLocks.push({
                        roomId: roomId,
                        objectIndex: objIndex,
                        requiredKeyId: obj.requires,
                        objectName: obj.name || obj.type
                    });
                }
            });
        }
    });
    
    console.log(`Found ${keyLocks.length} key locks in scenario:`, keyLocks);
    
    // Create mappings based on scenario definitions
    keyLocks.forEach(lock => {
        const keyId = lock.requiredKeyId;
        
        // Find the key in player inventory
        const key = playerKeys.find(k => window.lockRef(k.scenarioData) === keyId);
        
        if (key) {
            // Get the actual scenario keyPins for this lock
            let scenarioKeyPins = null;
            if (lock.objectIndex !== undefined) {
                // Object lock - get keyPins from the object
                const obj = window.gameState?.scenario?.rooms?.[lock.roomId]?.objects?.[lock.objectIndex];
                scenarioKeyPins = obj?.keyPins || obj?.key_pins;
            } else {
                // Room lock - get keyPins from the room
                const room = window.gameState?.scenario?.rooms?.[lock.roomId];
                scenarioKeyPins = room?.keyPins || room?.key_pins;
            }
            
            // Use scenario keyPins if available, otherwise generate random ones
            const pinHeights = scenarioKeyPins || generatePinHeightsForLock(lock.roomId, keyId);
            
            // Create a lock configuration for this specific lock
            const lockConfig = {
                id: `${lock.roomId}_${lock.objectIndex !== undefined ? `obj_${lock.objectIndex}` : 'room'}`,
                pinCount: pinHeights?.length || 4, // Use actual pin count from keyPins, default 4
                pinHeights: pinHeights, // Use scenario keyPins or generated ones
                difficulty: 'medium'
            };
            
            console.log(`📌 Lock mapping for key "${key.scenarioData.name}" (${keyId}):`, {
                lockLocation: `${lock.roomName}${lock.objectName ? ` - ${lock.objectName}` : ''}`,
                scenarioKeyPins: scenarioKeyPins,
                pinHeights: pinHeights,
                pinCount: lockConfig.pinCount
            });
            
            // Store the mapping
            window.keyLockMappings[keyId] = {
                lockId: lockConfig.id,
                lockConfig: lockConfig,
                keyName: key.scenarioData.name,
                roomId: lock.roomId,
                objectIndex: lock.objectIndex,
                lockName: lock.objectName || lock.roomName
            };
            
            console.log(`Assigned key "${key.scenarioData.name}" (${keyId}) to lock in ${lock.roomName}${lock.objectName ? ` - ${lock.objectName}` : ''}`);
        } else {
            console.warn(`Key "${keyId}" required by lock in ${lock.roomName}${lock.objectName ? ` - ${lock.objectName}` : ''} not found in inventory`);
        }
    });
    
    console.log('Key-lock mappings based on scenario:', window.keyLockMappings);
}

// Function to generate consistent pin heights for a lock based on room and key
function generatePinHeightsForLock(roomId, keyId) {
    // Use a deterministic seed based on room and key IDs
    const seed = (roomId + keyId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (min, max) => {
        const x = Math.sin(seed++) * 10000;
        return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    };
    
    const pinHeights = [];
    for (let i = 0; i < 4; i++) {
        pinHeights.push(25 + random(0, 37)); // 25-62 range
    }
    
    return pinHeights;
}

// Function to check if a key matches a specific lock
function doesKeyMatchLock(keyId, lockId) {
    if (!window.keyLockMappings || !window.keyLockMappings[keyId]) {
        return false;
    }
    
    const mapping = window.keyLockMappings[keyId];
    return mapping.lockId === lockId;
}

// Function to get the lock ID that a key is assigned to
function getKeyAssignedLock(keyId) {
    if (!window.keyLockMappings || !window.keyLockMappings[keyId]) {
        return null;
    }
    
    return window.keyLockMappings[keyId].lockId;
}

// Console helper functions for testing
window.reassignKeysToLocks = function() {
    // Clear existing mappings
    window.keyLockMappings = {};
    assignKeysToLocks();
    console.log('Key-lock mappings reassigned based on current scenario');
};

window.showKeyLockMappings = function() {
    console.log('Current key-lock mappings:', window.keyLockMappings);
    console.log('Available lock configurations:', PREDEFINED_LOCK_CONFIGS);
    
    // Show scenario-based mappings
    if (window.gameState?.scenario?.rooms) {
        console.log('Current scenario rooms:', Object.keys(window.gameState.scenario.rooms));
    }
};

window.testKeyLockMatch = function(keyId, lockId) {
    const matches = doesKeyMatchLock(keyId, lockId);
    console.log(`Key "${keyId}" ${matches ? 'MATCHES' : 'DOES NOT MATCH'} lock "${lockId}"`);
    return matches;
};

// Function to reinitialize mappings when scenario changes
window.initializeKeyLockMappings = function() {
    console.log('Initializing key-lock mappings for current scenario...');
    window.keyLockMappings = {};
    assignKeysToLocks();
};

// Initialize key-lock mappings when the game starts
if (window.inventory && window.inventory.items) {
    assignKeysToLocks();
}

// Function to generate key cuts that match a specific lock's pin configuration
export function generateKeyCutsForLock(key, lockable, overrideKeyPins = null) {
    const keyId = window.lockRef(key.scenarioData);
    
    // First, try to use provided keyPins override, then lockable's keyPins
    let keyPinsToUse = overrideKeyPins;
    if (!keyPinsToUse) {
        // Try to extract keyPins from the lockable (door or item)
        if (lockable?.doorProperties?.keyPins || lockable?.doorProperties?.key_pins) {
            keyPinsToUse = lockable.doorProperties.keyPins || lockable.doorProperties.key_pins;
            console.log(`✓ Using keyPins from lockable.doorProperties:`, keyPinsToUse);
        } else if (lockable?.scenarioData?.keyPins || lockable?.scenarioData?.key_pins) {
            keyPinsToUse = lockable.scenarioData.keyPins || lockable.scenarioData.key_pins;
            console.log(`✓ Using keyPins from lockable.scenarioData:`, keyPinsToUse);
        } else if (lockable?.keyPins || lockable?.key_pins) {
            keyPinsToUse = lockable.keyPins || lockable.key_pins;
            console.log(`✓ Using keyPins from lockable object:`, keyPinsToUse);
        };
    }
    
    // If we have keyPins from the scenario, use them directly
    if (keyPinsToUse && Array.isArray(keyPinsToUse)) {
        console.log(`Generating cuts for key "${key.scenarioData.name}" using scenario keyPins:`, keyPinsToUse);
        const cuts = KeyCutCalculator.calculateCutDepthsRounded(keyPinsToUse);
        console.log(`Generated cuts for key ${keyId} using scenario keyPins:`, cuts);
        return cuts;
    }
    
    // Check if this key has a predefined lock assignment
    if (window.keyLockMappings && window.keyLockMappings[keyId]) {
        const mapping = window.keyLockMappings[keyId];
        const lockConfig = mapping.lockConfig;
        
        console.log(`Generating cuts for key "${key.scenarioData.name}" assigned to lock "${mapping.lockId}"`);
        
        // Generate cuts based on the assigned lock's pin configuration
        const cuts = [];
        const pinHeights = lockConfig.pinHeights || [];
        
        for (let i = 0; i < lockConfig.pinCount; i++) {
            const keyPinLength = pinHeights[i] || 30; // Use predefined pin height
            cuts.push(KeyCutCalculator.calculateCutDepth(keyPinLength));
        }
        
        console.log(`Generated cuts for key ${keyId} (assigned to ${mapping.lockId}):`, cuts);
        return cuts;
    }
    
    // Fallback: Try to get the lock's pin configuration from the minigame framework
    let lockConfig = null;
    const lockId = lockable.scenarioData?.lockId || lockable.id || 'default_lock';
    if (window.lockConfigurations && window.lockConfigurations[lockId]) {
        lockConfig = window.lockConfigurations[lockId];
    }
    
    // If no saved config, generate a default configuration
    if (!lockConfig) {
        console.log(`No predefined mapping for key ${keyId} and no saved lock configuration for ${lockId}, generating default cuts`);
        // Generate random cuts based on the lock reference for consistency
        let seed = String(window.lockRef(key.scenarioData) || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const random = (min, max) => {
            const x = Math.sin(seed++) * 10000;
            return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
        };
        
        const cuts = [];
        const numCuts = key.scenarioData.pinCount || 4;
        for (let i = 0; i < numCuts; i++) {
            cuts.push(random(20, 80)); // Random cuts between 20-80
        }
        return cuts;
    }
    
    // Generate cuts based on the lock's actual pin configuration
    console.log(`Generating key cuts for lock ${lockId} with config:`, lockConfig);
    
    const cuts = [];
    const pinHeights = lockConfig.pinHeights || [];
    
    // Generate cuts that will work with the lock's pin heights
    for (let i = 0; i < lockConfig.pinCount; i++) {
        const keyPinLength = pinHeights[i] || (25 + Math.random() * 37.5); // Default if missing
        
        // Calculate cut depth using utility
        cuts.push(KeyCutCalculator.calculateCutDepth(keyPinLength));
    }
    
    console.log(`Generated cuts for key ${window.lockRef(key.scenarioData)}:`, cuts);
    return cuts;
}

// Export all functions for use in other modules
export {
    PREDEFINED_LOCK_CONFIGS,
    assignKeysToLocks,
    generatePinHeightsForLock,
    doesKeyMatchLock,
    getKeyAssignedLock
};

// Export for global access
window.assignKeysToLocks = assignKeysToLocks;
window.doesKeyMatchLock = doesKeyMatchLock;
window.getKeyAssignedLock = getKeyAssignedLock;
window.generateKeyCutsForLock = generateKeyCutsForLock;

