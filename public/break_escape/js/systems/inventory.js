// Inventory System
// Handles inventory management and display

// IMPORTANT: version must match all other imports of rooms.js — mismatched ?v= strings
// create separate module instances with separate rooms objects, causing state to diverge.
import { rooms } from '../core/rooms.js';
import InkEngine from './ink/ink-engine.js';
import { CSRF_TOKEN } from '../config.js';
import { setHudLabel, clearHudLabel } from '../ui/info-label.js';

// Helper function to create a unique identifier for an item
export function createItemIdentifier(scenarioData) {
    if (!scenarioData) return 'unknown';
    // Identity is 'id'; a key that carries only the lock it opens falls back to that.
    const itemId = scenarioData.id || window.lockRef(scenarioData) || '';
    const itemName = scenarioData.name || 'unnamed';
    const itemType = scenarioData.type || 'unknown';
    
    // If we have an ID, use it for precise matching
    if (itemId) {
        return `${itemType}_${itemId}`;
    }
    // Otherwise fall back to type + name
    return `${itemType}_${itemName}`;
}

// Initialize the inventory system
export function initializeInventory() {
    console.log('Inventory system initialized');
    
    // Initialize inventory state
    window.inventory = {
        items: [],
        container: null
    };
    
    // Get the HTML inventory container
    const inventoryContainer = document.getElementById('inventory-container');
    if (!inventoryContainer) {
        console.error('Inventory container not found');
        return;
    }
    
    inventoryContainer.innerHTML = '';
    
    // Store reference to container
    window.inventory.container = inventoryContainer;
    
    // Add notepad to inventory
    addNotepadToInventory();
    
    console.log('INVENTORY INITIALIZED', window.inventory);
}

// Helper function to preload intro messages for a phone
async function preloadPhoneIntroMessages(phoneId, allowedNpcIds = null) {
    console.log(`📱 preloadPhoneIntroMessages called for ${phoneId}`, { allowedNpcIds });
    
    if (!window.npcManager) {
        console.warn('❌ npcManager not available');
        return;
    }
    
    // Import PhoneChatConversation class (default export)
    const PhoneChatConversation = (await import('../minigames/phone-chat/phone-chat-conversation.js')).default;
    
    // Create a temporary ink engine for preloading
    const tempEngine = new InkEngine();
    
    let npcs = window.npcManager.getNPCsByPhone(phoneId);
    
    // Filter to only allowed NPCs if specified
    if (allowedNpcIds && allowedNpcIds.length > 0) {
        console.log(`🔍 Filtering NPCs: allowed = ${allowedNpcIds.join(', ')}`);
        npcs = npcs.filter(npc => allowedNpcIds.includes(npc.id));
    }
    
    console.log(`📱 Found ${npcs.length} NPCs on phone ${phoneId}:`, npcs.map(n => n.id));
    
    for (const npc of npcs) {
        try {
            // The same preload phone-chat runs (observer off, whole opening, deferred tags
            // and globals), so the thread's intro is complete and in order however the
            // phone is first reached
            await PhoneChatConversation.preloadOpening(npc, window.npcManager, tempEngine);
        } catch (error) {
            console.error(`❌ Error preloading intro for ${npc.id}:`, error);
        }
    }
    console.log(`📱 Finished preloading for phone ${phoneId}`);
}

// Process initial inventory items
export function processInitialInventoryItems() {
    console.log('Processing initial inventory items');
    
    if (!window.gameScenario) {
        console.error('Game scenario not loaded');
        return;
    }
    
    // Ensure inventory is initialized before processing
    if (!window.inventory || !Array.isArray(window.inventory.items)) {
        console.warn('Inventory not initialized, initializing now');
        initializeInventory();
    }
    
    // Track if we've already processed initial items to prevent duplicates
    if (window.inventory._initialItemsProcessed) {
        console.warn('Initial inventory items already processed - skipping to prevent duplicates');
        return;
    }
    
    // Mark as processed before adding items
    window.inventory._initialItemsProcessed = true;
    
    // Priority 1: Use server-side inventory if available (for page reload recovery)
    if (window.gameScenario.playerInventory && Array.isArray(window.gameScenario.playerInventory)) {
        console.log(`Processing ${window.gameScenario.playerInventory.length} items from server inventory`);
        
        window.gameScenario.playerInventory.forEach(itemData => {
            // Skip notepad as it's already added in initializeInventory
            if (itemData.type === 'notepad') {
                console.log('Skipping notepad - already in inventory');
                return;
            }
            
            // Check if item already exists in inventory (by ID, type, or name)
            const itemId = itemData.id || window.lockRef(itemData);
            const alreadyExists = window.inventory.items.some(existing => {
                const existingId = existing.scenarioData?.id || window.lockRef(existing.scenarioData);
                const existingType = existing.scenarioData?.type || existing.name;
                const existingName = existing.scenarioData?.name;
                
                // Match by ID if both have IDs
                if (itemId && existingId && itemId === existingId) {
                    return true;
                }
                
                // Match by type and name combination
                if (itemData.type === existingType && itemData.name === existingName) {
                    return true;
                }
                
                return false;
            });
            
            if (alreadyExists) {
                console.log(`Skipping duplicate item: ${itemData.name || itemData.type} (already in inventory)`);
                return;
            }
            
            console.log(`Adding ${itemData.name || itemData.type} to inventory from server playerInventory`);
            
            // Create inventory sprite for this object
            const inventoryItem = createInventorySprite(itemData);
            if (inventoryItem) {
                inventoryItem._restoredFromSave = true; // its onPickup ran when first taken
                addToInventory(inventoryItem);
            }
        });
        return; // Don't process startItemsInInventory if we loaded from server
    }
    
    // Priority 2: Fall back to startItemsInInventory from scenario (for new games)
    if (window.gameScenario.startItemsInInventory && Array.isArray(window.gameScenario.startItemsInInventory)) {
        console.log(`Processing ${window.gameScenario.startItemsInInventory.length} starting inventory items`);
        
        window.gameScenario.startItemsInInventory.forEach(itemData => {
            // Skip notepad as it's already added in initializeInventory
            if (itemData.type === 'notepad') {
                console.log('Skipping notepad - already in inventory');
                return;
            }
            
            // Check if item already exists in inventory (by ID, type, or name)
            const itemId = itemData.id || window.lockRef(itemData);
            const alreadyExists = window.inventory.items.some(existing => {
                const existingId = existing.scenarioData?.id || window.lockRef(existing.scenarioData);
                const existingType = existing.scenarioData?.type || existing.name;
                const existingName = existing.scenarioData?.name;
                
                // Match by ID if both have IDs
                if (itemId && existingId && itemId === existingId) {
                    return true;
                }
                
                // Match by type and name combination
                if (itemData.type === existingType && itemData.name === existingName) {
                    return true;
                }
                
                return false;
            });
            
            if (alreadyExists) {
                console.log(`Skipping duplicate item: ${itemData.name || itemData.type} (already in inventory)`);
                return;
            }
            
            console.log(`Adding ${itemData.name || itemData.type} to inventory from startItemsInInventory`);
            
            // Create inventory sprite for this object
            const inventoryItem = createInventorySprite(itemData);
            if (inventoryItem) {
                addToInventory(inventoryItem);
            }
        });
    } else {
        console.log('No startItemsInInventory defined in scenario');
    }
}

function createInventorySprite(itemData) {
    try {
        // Create a pseudo-sprite object that can be used in inventory
        const sprite = {
            name: itemData.type,
            objectId: `inventory_${itemData.type}_${Date.now()}`,
            scenarioData: itemData,
            texture: {
                key: itemData.type  // Use the type as the texture key for image lookup
            },
            // Copy critical properties for easy access
            keyPins: itemData.keyPins,  // Preserve keyPins for keys
            opens_lock: window.lockRef(itemData),  // the lock this item opens (keys)
            locked: itemData.locked,
            lockType: itemData.lockType,
            requires: itemData.requires,
            difficulty: itemData.difficulty,
            setVisible: function(visible) {
                // For inventory items, visibility is handled by DOM
                return this;
            }
        };
        
        console.log('Created inventory sprite:', {
            name: sprite.name,
            opens_lock: sprite.opens_lock,
            keyPins: sprite.keyPins,
            locked: sprite.locked,
            lockType: sprite.lockType
        });
        
        // Log if this is a key with keyPins
        if (sprite.keyPins) {
            console.log(`✓ Inventory key "${sprite.name}" has keyPins: [${sprite.keyPins.join(', ')}]`);
        }
        
        return sprite;
    } catch (error) {
        console.error('Error creating inventory sprite:', error);
        return null;
    }
}

/**
 * Put a notes item that arrived as a reward (no notes minigame) into the notepad,
 * apply its onRead/onPickup setVariable and emit item_picked_up. Mirrors
 * NPCGameBridge._receiveNote; window.addNote de-duplicates by title and text.
 */
function receiveRewardNote(item) {
    const text = item.text || item.observations || '';
    if (text && window.addNote) {
        const body = item.observations && item.text ? `${item.text}\n\nObservation: ${item.observations}` : text;
        const added = window.addNote(item.name || 'Note', body, !!item.important);
        if (added && window.gameAlert) {
            window.gameAlert(`Added "${item.name}" to your notes.`, 'info', 'Note Added', 3000);
        }
    }

    const readAction = item.onRead || item.onPickup;
    if (readAction?.setVariable && window.gameState?.globalVariables) {
        Object.entries(readAction.setVariable).forEach(([varName, value]) => {
            const oldValue = window.gameState.globalVariables[varName];
            window.gameState.globalVariables[varName] = value;
            window.npcConversationStateManager?.broadcastGlobalVariableChange(varName, value, null);
            window.eventDispatcher?.emit(`global_variable_changed:${varName}`, { name: varName, value, oldValue });
        });
    }

    window.eventDispatcher?.emit(`item_picked_up:${item.type}`, {
        itemType: item.type,
        itemName: item.name,
        itemId: item.id,
        collectionGroup: item.collection_group || null,
        roomId: window.currentPlayerRoom
    });
}

/**
 * Apply an item's onPickup.setVariable when the player takes it. Notes and text
 * files apply it when read (interactions.js, container-minigame.js); this covers
 * keys and every other takeable that gets an inventory slot. Only variables whose
 * value changes are set, so an item whose read already applied it, or a scenario
 * mapping that sets the same latch from item_picked_up, fires nothing twice.
 * Items restored from the server on reload are skipped: their pickup already ran
 * and the saved globals are authoritative.
 */
export function applyPickupAction(sprite) {
    const item = sprite?.scenarioData;
    const setVariable = item?.onPickup?.setVariable;
    if (!setVariable || sprite._restoredFromSave) return;
    const globals = window.gameState?.globalVariables;
    if (!globals) return;
    Object.entries(setVariable).forEach(([varName, value]) => {
        const oldValue = globals[varName];
        if (oldValue === value) return;
        globals[varName] = value;
        console.log(`🎒 onPickup.setVariable: ${varName} = ${value}`);
        window.npcConversationStateManager?.broadcastGlobalVariableChange(varName, value, null);
        window.eventDispatcher?.emit(`global_variable_changed:${varName}`, { name: varName, value, oldValue });
    });
}

/**
 * Put an item in the player's inventory, validating with the server first.
 *
 * Returns a result object, not a boolean, because callers need to tell two
 * very different outcomes apart:
 *
 *   { ok: true,  reason: 'added' }    slot created, item is held
 *   { ok: true,  reason: 'already' }  was already held; source may be removed
 *   { ok: false, reason: 'rejected' } the server refused it
 *   { ok: false, reason: 'error' }    network or unexpected failure
 *   { ok: false, reason: 'invalid' }  nothing usable was passed in
 *   { ok: false, reason: 'no-ui' }    server accepted but the UI is missing
 *
 * `ok` answers the only question most callers have: is the item in the
 * player's possession now? A caller that destroys the source -- an NPC
 * splicing it out of itemsHeld, a container removing the row -- must check
 * `ok` and do nothing when it is false. Returning a bare `false` for both
 * "already held" (success) and "server refused" (failure) is what let
 * giveItem() delete items outright: the NPC dropped the item and nothing
 * received it.
 *
 * Note this is async. `if (addToInventory(x))` tests a Promise and is always
 * true; callers must await the result before reading `ok`.
 */
export async function addToInventory(sprite) {
    if (!sprite || !sprite.scenarioData) {
        console.warn('Invalid sprite for inventory');
        return { ok: false, reason: 'invalid' };
    }

    try {
        console.log("Adding to inventory:", {
            objectId: sprite.objectId,
            name: sprite.name,
            type: sprite.scenarioData?.type,
            currentRoom: window.currentPlayerRoom
        });

        // Check if the item is already in the inventory (local check first)
        const itemIdentifier = createItemIdentifier(sprite.scenarioData);
        const itemData = sprite.scenarioData;
        
        // More robust duplicate check - compare by identifier, or by id/opens_lock if available
        const isAlreadyInInventory = window.inventory.items.some(item => {
            if (!item || !item.scenarioData) return false;
            
            const existingIdentifier = createItemIdentifier(item.scenarioData);
            if (existingIdentifier === itemIdentifier) {
                return true;
            }
            
            // Also check by id/opens_lock if both items have them
            const itemId = itemData.id || window.lockRef(itemData);
            const existingId = item.scenarioData.id || window.lockRef(item.scenarioData);
            if (itemId && existingId && itemId === existingId) {
                return true;
            }
            
            return false;
        });

        if (isAlreadyInInventory) {
            console.log(`Item ${itemIdentifier} (id: ${itemData.id || window.lockRef(itemData) || 'none'}) is already in inventory - removing from environment`);
            
            // Remove from environment even if already in inventory
            if (window.currentPlayerRoom && rooms[window.currentPlayerRoom] && rooms[window.currentPlayerRoom].objects) {
                if (rooms[window.currentPlayerRoom].objects[sprite.objectId]) {
                    const roomObj = rooms[window.currentPlayerRoom].objects[sprite.objectId];
                    if (roomObj.setVisible) {
                        roomObj.setVisible(false);
                    }
                    roomObj.active = false;
                    // Destroy proximity ghost immediately (interaction system stores it on roomObj)
                    if (roomObj.proximityGhost) {
                        roomObj.proximityGhost.destroy();
                        delete roomObj.proximityGhost;
                    }
                    console.log(`Removed duplicate object ${sprite.objectId} from room`);
                }
            }
            
            // Hide the sprite if it has setVisible method
            if (sprite.setVisible && typeof sprite.setVisible === 'function') {
                sprite.setVisible(false);
            }
            // Mark inactive so checkObjectInteractions won't re-create the proximity ghost
            sprite.active = false;
            sprite.isHighlighted = false;
            // Destroy proximity ghost on the sprite itself in case it differs from roomObj
            if (sprite.proximityGhost) {
                sprite.proximityGhost.destroy();
                delete sprite.proximityGhost;
            }
            if (window.eventDispatcher) {
                window.eventDispatcher.emit('item_removed_from_scene', { sprite });
            }
            
            // Show notification to player
            if (window.gameAlert) {
                window.gameAlert('Already in inventory', 'info', itemData.name || 'Item', 2000);
            }

            // The player holds it, so a caller that owns the source is safe to
            // remove it. This is the case that must not look like a refusal.
            return { ok: true, reason: 'already' };
        }

        // NEW: Validate with server before adding
        const gameId = window.breakEscapeConfig?.gameId;
        if (gameId) {
            try {
                // Create item data with ID from scenario if available
                const itemData = sprite.scenarioData;

                const response = await fetch(`/break_escape/games/${gameId}/inventory`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-Token': CSRF_TOKEN
                    },
                    body: JSON.stringify({
                        action_type: 'add',
                        item: itemData,
                        source_npc_id: sprite.sourceNpcId || undefined
                    })
                });

                const result = await response.json();

                if (!result.success) {
                    // Server rejected - show error to player
                    console.warn('Server rejected inventory add:', result.message);
                    if (window.gameAlert) {
                        window.gameAlert(result.message || 'Cannot collect this item', 'error', 'Invalid Action', 3000);
                    }
                    return { ok: false, reason: 'rejected', message: result.message };
                }

                // Server accepted - continue with local inventory update
                console.log('Server validated item collection:', result);
            } catch (error) {
                console.error('Failed to validate inventory with server:', error);
                // Fail closed - don't add if server can't validate
                if (window.gameAlert) {
                    window.gameAlert('Network error - please try again', 'error', 'Error', 3000);
                }
                return { ok: false, reason: 'error', message: error.message };
            }
        }

        // Remove from room if it exists and sync with server
        if (window.currentPlayerRoom && rooms[window.currentPlayerRoom] && rooms[window.currentPlayerRoom].objects) {
            if (rooms[window.currentPlayerRoom].objects[sprite.objectId]) {
                const roomObj = rooms[window.currentPlayerRoom].objects[sprite.objectId];
                if (roomObj.setVisible) {
                    roomObj.setVisible(false);
                }
                roomObj.active = false;
                // Destroy proximity ghost immediately (interaction system stores it on roomObj)
                if (roomObj.proximityGhost) {
                    roomObj.proximityGhost.destroy();
                    delete roomObj.proximityGhost;
                }
                console.log(`Removed object ${sprite.objectId} from room`);
                
                // Sync object removal with server's canonical room JSON.
                // Use sprite.roomId (stamped at load time) rather than window.currentPlayerRoom
                // in case the player moved rooms after picking up the item.
                if (window.RoomStateSync) {
                    const roomId = sprite.roomId || window.currentPlayerRoom;
                    window.RoomStateSync.removeItemFromRoom(roomId, sprite.objectId).catch(err => {
                        console.error('Failed to sync object removal to server:', err);
                        // Don't fail the pickup - local state is already updated
                    });
                }
            }
        }
        
        // Only call setVisible if it's a Phaser sprite with that method
        if (sprite.setVisible && typeof sprite.setVisible === 'function') {
            sprite.setVisible(false);
        }
        // Mark inactive so checkObjectInteractions won't re-create the proximity ghost
        sprite.active = false;
        sprite.isHighlighted = false;
        // Destroy proximity ghost on the sprite itself in case it differs from roomObj
        if (sprite.proximityGhost) {
            sprite.proximityGhost.destroy();
            delete sprite.proximityGhost;
        }
        if (window.eventDispatcher) {
            window.eventDispatcher.emit('item_removed_from_scene', { sprite });
        }
        
        // Special handling for keys - group them together
        if (sprite.scenarioData.type === 'key') {
            // addKeyToInventory is synchronous and returns a bare boolean.
            return addKeyToInventory(sprite)
                ? { ok: true, reason: 'added' }
                : { ok: false, reason: 'error' };
        }

        // Notes-family items (notes, notes2, ...) belong in the notepad, not the inventory UI.
        // The server POST above already registered them, so containers will filter them out on
        // next load. We skip the visual slot and the item_picked_up event here (interactions.js
        // already emitted it before opening the notes minigame).
        // Exception: notes that arrive without the notes minigame (flag rewards and timers via
        // apply-actions give_item, objectId 'action_item_*'). Nothing else will show them, so add
        // them to the notepad and fire onRead/item_picked_up as reading one in the world does.
        // World pickups, container takes and NPC gifts (which npc-game-bridge handles itself)
        // don't use that objectId, so they are never added twice.
        if (/^notes\d*$/.test(sprite.scenarioData?.type)) {
            if (/^action_item_/.test(sprite.objectId || '')) {
                receiveRewardNote(sprite.scenarioData);
            }
            return { ok: true, reason: 'added' };
        }

        // Create a new slot for this item
        const inventoryContainer = document.getElementById('inventory-container');
        if (!inventoryContainer) {
            // The server already recorded it, so the item is not lost -- but
            // without a slot the player cannot use it, so report failure and
            // leave the source alone. Re-collecting is idempotent server-side.
            console.error('Inventory container not found');
            return { ok: false, reason: 'no-ui' };
        }
        
        // Create a new slot
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        inventoryContainer.appendChild(slot);
        
        // Create inventory item
        const itemImg = document.createElement('img');
        itemImg.className = 'inventory-item';
        itemImg.src = `/break_escape/assets/objects/${sprite.texture?.key || sprite.name || sprite.scenarioData?.type}.png`;
        itemImg.alt = sprite.scenarioData.name;
        
        // Add item data
        itemImg.scenarioData = sprite.scenarioData;
        itemImg.name = sprite.name;
        itemImg.objectId = 'inventory_' + sprite.objectId;
        
        // Explicitly preserve critical lock-related properties
        itemImg.keyPins = sprite.keyPins || sprite.scenarioData?.keyPins;
        itemImg.opens_lock = sprite.opens_lock || window.lockRef(sprite.scenarioData);
        itemImg.lockType = sprite.scenarioData?.lockType;
        itemImg.locked = sprite.scenarioData?.locked;
        itemImg.requires = sprite.scenarioData?.requires;
        itemImg.difficulty = sprite.scenarioData?.difficulty;
        
        // Add data-type attribute for CSS styling
        itemImg.setAttribute('data-type', sprite.scenarioData?.type);
        
        // For phones, add unread message count and badge
        if (sprite.scenarioData?.type === 'phone' && sprite.scenarioData?.phoneId) {
            const phoneId = sprite.scenarioData.phoneId;
            const npcIds = sprite.scenarioData.npcIds || null;  // Get allowed NPCs for this phone
            itemImg.setAttribute('data-phone-id', phoneId);
            
            if (window.npcManager) {
                // Preload intro messages for all NPCs on this phone
                preloadPhoneIntroMessages(phoneId, npcIds).then(() => {
                    const unreadCount = window.npcManager.getTotalUnreadCount(phoneId, npcIds);
                    console.log(`📱 Phone ${phoneId} added to inventory, unread count: ${unreadCount}`, { npcIds });
                    itemImg.setAttribute('data-unread-count', unreadCount);
                    
                    // Create badge element if there are unread messages
                    if (unreadCount > 0) {
                        console.log(`✅ Creating badge for phone ${phoneId}`);
                        const badge = document.createElement('span');
                        badge.className = 'phone-badge';
                        badge.textContent = unreadCount;
                        itemImg.parentElement.appendChild(badge);
                    } else {
                        console.log(`❌ Not creating badge, count is ${unreadCount}`);
                    }
                });
            } else {
                console.log('❌ npcManager not available when adding phone');
            }
        }
        
        // Mark as non-takeable once in inventory (so it won't try to be picked up again)
        itemImg.scenarioData.takeable = false;
        
        // Add click handler
        itemImg.addEventListener('click', function() {
            if (window.handleObjectInteraction) {
                window.handleObjectInteraction(this);
            }
        });
        itemImg.addEventListener('mouseenter', () => setHudLabel(sprite.scenarioData.name));
        itemImg.addEventListener('mouseleave', () => clearHudLabel());

        // Add to slot
        slot.appendChild(itemImg);
        
        // Add to inventory array
        window.inventory.items.push(itemImg);
        
        applyPickupAction(sprite);

        // Emit NPC event for item pickup
        if (window.eventDispatcher) {
            window.eventDispatcher.emit(`item_picked_up:${sprite.scenarioData.type}`, {
                itemType: sprite.scenarioData.type,
                itemName: sprite.scenarioData.name,
                itemId: sprite.scenarioData.id || window.lockRef(sprite.scenarioData),
                collectionGroup: sprite.scenarioData.collection_group || null,
                roomId: window.currentPlayerRoom
            });
        }
        
        // Apply pulse animation to the slot instead of showing notification
        slot.classList.add('pulse');
        // Remove the pulse class after the animation completes
        setTimeout(() => {
            slot.classList.remove('pulse');
        }, 600);
        
        // If this is the Bluetooth scanner, automatically open the minigame after adding to inventory
        if (sprite.scenarioData.type === "bluetooth_scanner" && window.startBluetoothScannerMinigame) {
            // Small delay to ensure the item is fully added to inventory
            setTimeout(() => {
                console.log('Auto-opening bluetooth scanner minigame after adding to inventory');
                window.startBluetoothScannerMinigame(itemImg);
            }, 500);
        }
        
        
        // Fingerprint kit is now handled as a minigame when clicked from inventory
        
        // Handle crypto workstation - use the proper modal implementation from helpers.js
        if (sprite.scenarioData.type === "workstation") {
            // Don't override the openCryptoWorkstation function - it's already properly defined in helpers.js
            console.log('Crypto workstation added to inventory - modal function available');
        }
        
        return { ok: true, reason: 'added' };
    } catch (error) {
        console.error('Error adding to inventory:', error);
        return { ok: false, reason: 'error', message: error.message };
    }
}

// Key management functions
function addKeyToInventory(sprite) {
    // Initialize key ring if it doesn't exist
    if (!window.inventory.keyRing) {
        window.inventory.keyRing = {
            keys: [],
            slot: null,
            itemImg: null
        };
    }
    
    // DEBUG: Check properties before adding
    const keyId = window.lockRef(sprite.scenarioData) || sprite.opens_lock;
    const keyPins = sprite.scenarioData?.keyPins || sprite.keyPins;
    console.log(`🔑 BEFORE adding key to ring (sprite object):`, {
        sprite_opens_lock: sprite.opens_lock,
        sprite_keyPins: sprite.keyPins,
        scenarioData_opens_lock: window.lockRef(sprite.scenarioData),
        scenarioData_keyPins: sprite.scenarioData?.keyPins,
        resolved_opens_lock: keyId,
        resolved_keyPins: keyPins
    });
    
    // Add the key to the key ring
    window.inventory.keyRing.keys.push(sprite);
    
    // Log key storage with keyPins
    console.log(`✓ Key "${sprite.scenarioData?.name}" added to key ring:`, {
        opens_lock: keyId,
        keyPins: keyPins,
        locked: sprite.scenarioData?.locked,
        lockType: sprite.scenarioData?.lockType
    });
    
    applyPickupAction(sprite);

    // Emit item_picked_up event for keys (matching regular item pickup event format)
    if (window.eventDispatcher) {
        window.eventDispatcher.emit(`item_picked_up:key`, {
            itemType: 'key',
            itemName: sprite.scenarioData?.name || 'Unknown Key',
            itemId: sprite.scenarioData?.id || keyId,
            keyId: keyId,
            roomId: window.currentPlayerRoom
        });
    }
    
    // Update or create the key ring display
    updateKeyRingDisplay();
    
    // IMPORTANT: Reinitialize key-lock mappings now that we have a new key
    // This is critical for newly acquired keys (e.g., dropped by NPCs) to unlock doors
    if (window.initializeKeyLockMappings) {
        console.log('🔑 Reinitializing key-lock mappings after adding key to inventory');
        window.initializeKeyLockMappings();
    }
    
    // Apply pulse animation to the key ring slot instead of showing notification
    const keyRingSlot = window.inventory.keyRing.slot;
    if (keyRingSlot) {
        keyRingSlot.classList.add('pulse');
        setTimeout(() => {
            keyRingSlot.classList.remove('pulse');
        }, 600);
    }
    
    return true;
}

function updateKeyRingDisplay() {
    const keyRing = window.inventory.keyRing;
    if (!keyRing || keyRing.keys.length === 0) {
        // Remove key ring display if no keys
        if (keyRing && keyRing.slot) {
            keyRing.slot.remove();
            keyRing.slot = null;
            keyRing.itemImg = null;
        }
        return;
    }
    
    const inventoryContainer = document.getElementById('inventory-container');
    if (!inventoryContainer) {
        console.error('Inventory container not found');
        return;
    }
    
    // Remove existing key ring slot if it exists
    if (keyRing.slot) {
        keyRing.slot.remove();
    }
    
    // Create new slot for key ring
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    inventoryContainer.appendChild(slot);
    
    // Create key ring item
    const itemImg = document.createElement('img');
    itemImg.className = 'inventory-item';
    itemImg.src = keyRing.keys.length === 1 ? `/break_escape/assets/objects/key.png` : `/break_escape/assets/objects/key-ring.png`;
    itemImg.alt = keyRing.keys.length === 1 ? keyRing.keys[0].scenarioData.name : 'Key Ring';
    
    // Add data attributes for styling
    itemImg.setAttribute('data-type', 'key_ring');
    itemImg.setAttribute('data-key-count', keyRing.keys.length);
    
    // Add item data - use the first key's data as the primary data
    const allKeysData = keyRing.keys.map(k => k.scenarioData);
    console.log(`🔑 Building key ring scenarioData with ${keyRing.keys.length} keys:`, {
        firstKeyScenarioData: keyRing.keys[0].scenarioData,
        allKeysData: allKeysData
    });
    
    itemImg.scenarioData = {
        ...keyRing.keys[0].scenarioData,
        name: keyRing.keys.length === 1 ? keyRing.keys[0].scenarioData.name : 'Key Ring',
        type: 'key_ring',
        keyCount: keyRing.keys.length,
        allKeys: allKeysData
    };
    itemImg.name = 'key';
    itemImg.objectId = 'inventory_key_ring';
    
    // Add click handler for key ring
    itemImg.addEventListener('click', function() {
        if (window.handleKeyRingInteraction) {
            window.handleKeyRingInteraction(this);
        }
    });
    const keyRingLabel = keyRing.keys.length === 1 ? keyRing.keys[0].scenarioData.name : 'Key Ring';
    itemImg.addEventListener('mouseenter', () => setHudLabel(keyRingLabel));
    itemImg.addEventListener('mouseleave', () => clearHudLabel());

    // Add to slot
    slot.appendChild(itemImg);
    
    // Store references
    keyRing.slot = slot;
    keyRing.itemImg = itemImg;
    
    // Add to inventory array (replace any existing key ring item)
    const existingKeyRingIndex = window.inventory.items.findIndex(item => 
        item && item.scenarioData && item.scenarioData.type === 'key_ring'
    );
    
    if (existingKeyRingIndex !== -1) {
        window.inventory.items[existingKeyRingIndex] = itemImg;
    } else {
        window.inventory.items.push(itemImg);
    }
}

function handleKeyRingInteraction(keyRingItem) {
    const keyRing = window.inventory.keyRing;
    if (!keyRing || keyRing.keys.length === 0) {
        return;
    }
    
    if (keyRing.keys.length === 1) {
        // Single key - handle normally
        if (window.handleObjectInteraction) {
            window.handleObjectInteraction(keyRingItem);
        }
    } else {
        // Multiple keys - show list
        const keyNames = keyRing.keys.map(key => key.scenarioData.name).join('\n• ');
        const message = `Key Ring contains ${keyRing.keys.length} keys:\n• ${keyNames}`;
        
        if (window.gameAlert) {
            window.gameAlert(message, 'info', 'Key Ring', 0);
        }
    }
}

// Add notepad to inventory
function addNotepadToInventory() {
    // Check if notepad is already in inventory
    const notepadExists = window.inventory.items.some(item => 
        item && item.scenarioData && item.scenarioData.type === 'notepad'
    );
    
    if (notepadExists) {
        console.log('Notepad already in inventory');
        return;
    }
    
    // Create notepad item data
    const notepadData = {
        type: 'notepad',
        name: 'Notepad',
        takeable: true,
        readable: true,
        text: 'Use this notepad to review your collected notes and observations.',
        observations: 'A handy notepad for keeping track of important information.'
    };
    
    // Create a mock sprite object for the notepad
    const notepadSprite = {
        name: 'notes5',
        objectId: 'notepad_inventory',
        scenarioData: notepadData,
        setVisible: function(visible) {
            // For inventory items, visibility is handled by DOM
            return this;
        }
    };
    
    // Add to inventory
    addToInventory(notepadSprite);
    
    // Also add the notepad as a note at the beginning of the notes collection
    if (window.addNote) {
        const notepadText = 'Use this notepad to review your collected notes and observations.\n\nObservation: A handy notepad for keeping track of important information.';
        const notepadNote = window.addNote('Notepad', notepadText, false);
        if (notepadNote) {
            // Move the notepad note to the beginning of the notes array
            const notes = window.gameState.notes;
            const notepadIndex = notes.findIndex(note => note.id === notepadNote.id);
            if (notepadIndex !== -1) {
                const notepadNoteItem = notes.splice(notepadIndex, 1)[0];
                notes.unshift(notepadNoteItem); // Add to beginning
                console.log('Notepad note with observations added to beginning of notes collection during inventory setup');
            }
        }
    }
}

// Remove item from inventory
export function removeFromInventory(item) {
    try {
        // Find the item in the inventory array
        const itemIndex = window.inventory.items.indexOf(item);
        if (itemIndex === -1) return false;
        
        // Remove from array
        window.inventory.items.splice(itemIndex, 1);
        
        // Remove the entire slot from DOM
        const slot = item.parentElement;
        if (slot && slot.classList.contains('inventory-slot')) {
            slot.remove();
        }
        
        // Hide bluetooth toggle if we dropped the bluetooth scanner
        if (item.scenarioData.type === "bluetooth_scanner") {
            const bluetoothToggle = document.getElementById('bluetooth-toggle');
            if (bluetoothToggle) {
                bluetoothToggle.style.display = 'none';
            }
        }
        
        // Hide biometrics toggle if we dropped the fingerprint kit
        if (item.scenarioData.type === "fingerprint_kit") {
            const biometricsToggle = document.getElementById('biometrics-toggle');
            if (biometricsToggle) {
                biometricsToggle.style.display = 'none';
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error removing from inventory:', error);
        return false;
    }
}

// Update phone badge with unread count
export function updatePhoneBadge(phoneId) {
    if (!window.npcManager) return;
    
    // Find phone items in inventory
    const phoneItems = window.inventory.items.filter(item => 
        item.scenarioData?.type === 'phone' && 
        item.getAttribute('data-phone-id') === phoneId
    );
    
    // Update badge for each phone with this ID
    phoneItems.forEach(phoneItem => {
        const npcIds = phoneItem.scenarioData?.npcIds || null;  // Get allowed NPCs for this phone
        const unreadCount = window.npcManager.getTotalUnreadCount(phoneId, npcIds);
        phoneItem.setAttribute('data-unread-count', unreadCount);
        
        // Get the inventory slot (parent element)
        const inventorySlot = phoneItem.parentElement;
        if (!inventorySlot) return;
        
        // Remove existing badge if present
        const existingBadge = inventorySlot.querySelector('.phone-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Create new badge if there are unread messages
        if (unreadCount > 0) {
            const badge = document.createElement('span');
            badge.className = 'phone-badge';
            badge.textContent = unreadCount;
            inventorySlot.appendChild(badge);
        }
    });
}

// Export for global access
window.initializeInventory = initializeInventory;
window.processInitialInventoryItems = processInitialInventoryItems;
window.addToInventory = addToInventory;
window.removeFromInventory = removeFromInventory;
window.addNotepadToInventory = addNotepadToInventory;
window.createItemIdentifier = createItemIdentifier;
window.handleKeyRingInteraction = handleKeyRingInteraction;
window.updatePhoneBadge = updatePhoneBadge; 