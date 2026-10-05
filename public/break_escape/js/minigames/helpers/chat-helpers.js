/**
 * Shared Chat Minigame Helpers
 * 
 * Common utilities for phone-chat and person-chat minigames:
 * - Game action tag processing (give_item, unlock_door, etc.)
 * - UI notification handling
 * 
 * @module chat-helpers
 */

import { getRoomDisplayName } from '../../utils/room-display-name.js';

/**
 * Process game action tags from Ink story
 * Tags format: # unlock_door:ceo, # give_item:keycard|CEO Keycard, etc.
 * Filters out speaker tags (player, npc, speaker:player, speaker:npc)
 * 
 * @param {Array<string>} tags - Array of tag strings from Ink story
 * @param {Object} ui - UI controller with showNotification method
 * @returns {Array<Object>} Array of processing results for each tag
 */
export async function processGameActionTags(tags, ui) {
    if (!window.NPCGameBridge) {
        console.warn('⚠️ NPCGameBridge not available, skipping tag processing');
        return [];
    }
    
    if (!tags || tags.length === 0) {
        return [];
    }
    
    // Filter out speaker tags - only process action tags
    const actionTags = tags.filter(tag => {
        const action = tag.split(':')[0].trim().toLowerCase();
        return action !== 'player' && 
               action !== 'npc' && 
               action !== 'speaker' &&
               !tag.includes('speaker:');
    });
    
    if (actionTags.length === 0) {
        // No action tags to process (all were speaker tags)
        return [];
    }
    
    console.log('🏷️ Processing game action tags:', actionTags);
    
    const results = [];
    
    for (const tag of actionTags) {
        const trimmedTag = tag.trim();
        
        // Skip empty tags
        if (!trimmedTag) continue;
        
        // Parse action and parameter (format: "action:param" or "action")
        // Split only on FIRST colon to preserve colons in parameters (e.g., set_global:var:value)
        const colonIndex = trimmedTag.indexOf(':');
        const action = colonIndex === -1 ? trimmedTag : trimmedTag.substring(0, colonIndex).trim();
        const param = colonIndex === -1 ? '' : trimmedTag.substring(colonIndex + 1).trim();
        
        let result = { action, param, success: false, message: '' };
        
        try {
            switch (action) {
                case 'unlock_door':
                    if (param) {
                        // unlockDoor is now async and calls server for validation
                        // Fire and forget - don't wait for promise to resolve
                        // This allows subsequent tags and choices to be processed
                        window.NPCGameBridge.unlockDoor(param).then(unlockResult => {
                            if (unlockResult.success) {
                                if (ui) ui.showNotification(`🔓 Door unlocked: ${getRoomDisplayName(param)}`, 'success');
                                console.log('✅ Door unlock successful:', unlockResult);
                            } else {
                                const errorMsg = `⚠️ Failed to unlock: ${getRoomDisplayName(param)} - ${unlockResult.error || 'Unknown error'}`;
                                if (ui) ui.showNotification(errorMsg, 'warning');
                                console.warn('⚠️ Door unlock failed:', unlockResult);
                            }
                        }).catch(error => {
                            const errorMsg = `⚠️ Door unlock error: ${error.message}`;
                            if (ui) ui.showNotification(errorMsg, 'error');
                            console.error('⚠️ Door unlock exception:', error);
                        });
                        result.success = true;
                        result.message = `🔓 Door unlock started for: ${param}`;
                    } else {
                        result.message = '⚠️ unlock_door tag missing room parameter';
                        console.warn(result.message);
                    }
                    break;
                    
                case 'give_item':
                    if (param) {
                        const [itemType, itemSelector] = param.split(/[|:]/).map(s => s.trim());
                        const npcId = window.currentConversationNPCId;
                        
                        if (!npcId) {
                            result.message = '⚠️ No NPC context available';
                            console.warn(result.message);
                            break;
                        }
                        
                        // giveItem is async - await it so multiple give_item tags are
                        // processed sequentially, preventing concurrent server writes
                        // that cause SQLite "database busy" errors.
                        result.message = `📦 Receiving: ${itemType}`;
                        const giveResult = await window.NPCGameBridge.giveItem(npcId, itemType, itemSelector || null);
                        if (giveResult.success) {
                            console.log('✅ Item given and server inventory synced:', giveResult);
                            if (ui) ui.showNotification(`📦 Received: ${giveResult.item.name}`, 'success');
                        } else {
                            console.warn('⚠️ Item give failed:', giveResult);
                            if (ui) ui.showNotification(`⚠️ ${giveResult.error}`, 'warning');
                        }
                        result.success = giveResult.success;
                    } else {
                        result.message = '⚠️ give_item requires item type parameter';
                        console.warn(result.message);
                    }
                    break;
                    
                case 'give_npc_inventory_items':
                    const npcId = window.currentConversationNPCId;
                    
                    if (!npcId) {
                        result.message = '⚠️ No NPC context available';
                        console.warn(result.message);
                        break;
                    }
                    
                    // Parse filter types (comma-separated)
                    const filterTypes = param ? param.split(',').map(s => s.trim()).filter(s => s) : null;
                    
                    const showResult = window.NPCGameBridge.showNPCInventory(npcId, filterTypes);
                    if (showResult.success) {
                        result.success = true;
                        result.message = `📦 Opening inventory with ${showResult.itemCount} items`;
                        console.log('✅ NPC inventory opened:', showResult);
                    } else {
                        result.message = `⚠️ ${showResult.error}`;
                        if (ui) ui.showNotification(result.message, 'warning');
                        console.warn('⚠️ Show inventory failed:', showResult);
                    }
                    break;
                    
                case 'set_objective':
                    if (param) {
                        window.NPCGameBridge.setObjective(param);
                        result.success = true;
                        result.message = `🎯 New objective: ${param}`;
                        if (ui) ui.showNotification(result.message, 'info');
                    } else {
                        result.message = '⚠️ set_objective tag missing text parameter';
                        console.warn(result.message);
                    }
                    break;
                    
                case 'reveal_secret':
                    if (param) {
                        const [secretId, secretData] = param.split('|').map(s => s.trim());
                        window.NPCGameBridge.revealSecret(secretId, secretData);
                        result.success = true;
                        result.message = `🔍 Secret revealed: ${secretId}`;
                        if (ui) ui.showNotification(result.message, 'info');
                    } else {
                        result.message = '⚠️ reveal_secret tag missing parameter';
                        console.warn(result.message);
                    }
                    break;
                    
                case 'add_note':
                    if (param) {
                        const [title, content] = param.split('|').map(s => s.trim());
                        window.NPCGameBridge.addNote(title, content || '');
                        result.success = true;
                        result.message = `📝 Note added: ${title}`;
                        if (ui) ui.showNotification(result.message, 'info');
                    } else {
                        result.message = '⚠️ add_note tag missing parameter';
                        console.warn(result.message);
                    }
                    break;
                    
                case 'trigger_minigame':
                    if (param) {
                        const minigameName = param;
                        result.success = true;
                        result.message = `🎮 Triggering minigame: ${minigameName}`;
                        if (ui) ui.showNotification(result.message, 'info');
                        // Note: Actual minigame triggering would be game-specific
                        console.log('🎮 Minigame trigger tag:', minigameName);
                    } else {
                        result.message = '⚠️ trigger_minigame tag missing minigame name';
                        console.warn(result.message);
                    }
                    break;
                    
                case 'influence_increased':
                    {
                        const npcId = window.currentConversationNPCId;
                        if (npcId && window.npcManager) {
                            const npc = window.npcManager.getNPC(npcId);
                            const displayName = npc?.displayName || npc?.name || npcId;
                            result.success = true;
                            result.message = `+ Influence: ${displayName}`;
                            showInfluencePopup(displayName, 'increased');
                            console.log(`✨ Influence increased with ${displayName}`);
                        }
                    }
                    break;
                    
                case 'influence_decreased':
                    {
                        const npcId = window.currentConversationNPCId;
                        if (npcId && window.npcManager) {
                            const npc = window.npcManager.getNPC(npcId);
                            const displayName = npc?.displayName || npc?.name || npcId;
                            result.success = true;
                            result.message = `- Influence: ${displayName}`;
                            showInfluencePopup(displayName, 'decreased');
                            console.log(`⚠️ Influence decreased with ${displayName}`);
                        }
                    }
                    break;

                case 'remove_npc':
                    {
                        // Format: #remove_npc  (uses current conversation NPC)
                        //     or: #remove_npc:npc_id  (explicit NPC ID)
                        const removeNpcId = param || window.currentConversationNPCId;
                        if (!removeNpcId) {
                            result.message = '⚠️ remove_npc tag missing NPC ID and no conversation NPC in context';
                            console.warn(result.message);
                            break;
                        }
                        const removeResult = await window.NPCGameBridge.removeNpcFromScene(removeNpcId);
                        result.success = removeResult.success;
                        result.message = removeResult.success
                            ? `🚪 NPC removed from scene: ${removeNpcId}`
                            : `⚠️ ${removeResult.error}`;
                        if (!removeResult.success) {
                            console.warn('⚠️ NPC remove from scene failed:', removeResult);
                        }
                    }
                    break;

                case 'hostile':
                    {
                        const npcId = param || window.currentConversationNPCId;

                        if (!npcId) {
                            result.message = '⚠️ hostile tag missing NPC ID';
                            console.warn(result.message);
                            break;
                        }

                        console.log(`🔴 Processing hostile tag for NPC: ${npcId}`);

                        // Set NPC to hostile state
                        if (window.npcHostileSystem) {
                            window.npcHostileSystem.setNPCHostile(npcId, true);
                            result.success = true;
                            result.message = `⚠️ ${npcId} is now hostile!`;
                            if (ui) ui.showNotification(result.message, 'warning');
                        } else {
                            result.message = '⚠️ Hostile system not initialized';
                            console.warn(result.message);
                        }

                        // Emit event for other systems
                        if (window.eventDispatcher) {
                            window.eventDispatcher.emit('npc_became_hostile', { npcId });
                        }
                    }
                    break;
                case 'transition_to_person_chat':
                    {
                        // Format: transition_to_person_chat:npcId|background|knot
                        // Example: # transition_to_person_chat:closing_debrief_trigger|assets/backgrounds/hq1.png|start
                        const [targetNpcId, background, targetKnot] = param ? param.split('|').map(s => s.trim()) : [];
                        
                        if (!targetNpcId) {
                            result.message = '⚠️ transition_to_person_chat requires npcId parameter';
                            console.warn(result.message);
                            break;
                        }
                        
                        console.log('🔄 Transitioning to person-chat:', { targetNpcId, background, targetKnot });
                        
                        // Close current phone-chat minigame
                        if (window.MinigameFramework && window.MinigameFramework.currentMinigame) {
                            window.MinigameFramework.currentMinigame.complete(false);
                        }
                        
                        // Small delay before starting person-chat
                        setTimeout(() => {
                            if (window.MinigameFramework) {
                                window.MinigameFramework.startMinigame('person-chat', {
                                    npcId: targetNpcId,
                                    background: background || null,
                                    startKnot: targetKnot || null
                                });
                            }
                        }, 100);
                        
                        result.success = true;
                        result.message = `🔄 Transitioning to person-chat with ${targetNpcId}`;
                    }
                    break;
                    
                case 'clone_keycard':
                    // Parameter is the card_id to clone
                    // Look up card data from NPC's rfidCard property
                    const cardId = param;
                    
                    if (!cardId) {
                        result.message = '⚠️ clone_keycard tag missing card ID parameter';
                        console.warn(result.message);
                        break;
                    }

                    // Check if player has RFID cloner
                    const hasCloner = window.inventory.items.some(item =>
                        item && item.scenarioData &&
                        item.scenarioData.type === 'rfid_cloner'
                    );

                    if (!hasCloner) {
                        result.message = '⚠️ You need an RFID cloner to clone cards';
                        if (ui) ui.showNotification(result.message, 'warning');
                        break;
                    }

                    // Get NPC and their card data
                    const cloneNpcId = window.currentConversationNPCId;
                    let cardData = null;
                    
                    if (cloneNpcId && window.npcManager) {
                        const npc = window.npcManager.getNPC(cloneNpcId);
                        if (npc?.rfidCard && npc.rfidCard.card_id === cardId) {
                            // Use NPC's rfidCard data
                            cardData = {
                                name: npc.rfidCard.name || cardId,
                                card_id: npc.rfidCard.card_id,
                                rfid_protocol: npc.rfidCard.rfid_protocol || 'EM4100',
                                type: 'keycard'
                            };
                        }
                    }
                    
                    // Fallback if NPC card not found
                    if (!cardData) {
                        cardData = {
                            name: cardId,
                            card_id: cardId,
                            rfid_protocol: 'EM4100',
                            type: 'keycard'
                        };
                    }

                    // Set pending conversation return (MINIMAL CONTEXT!)
                    // Conversation state automatically managed by npcConversationStateManager
                    window.pendingConversationReturn = {
                        npcId: window.currentConversationNPCId,
                        type: window.currentConversationMinigameType || 'person-chat'
                    };

                    // Start RFID minigame in clone mode
                    if (window.startRFIDMinigame) {
                        window.startRFIDMinigame(null, null, {
                            mode: 'clone',
                            cardToClone: cardData
                        });

                        result.success = true;
                        result.message = `📡 Starting card clone: ${cardData.name}`;
                        console.log('🔐 Started RFID clone minigame for:', cardData.name);
                    } else {
                        result.message = '⚠️ RFID minigame not available';
                        console.warn('startRFIDMinigame not found');
                    }
                    break;

                // ==========================================
                // Objectives System Tags
                // ==========================================
                
                case 'complete_task':
                    if (param) {
                        const taskId = param;
                        // Emit event for ObjectivesManager to handle
                        if (window.eventDispatcher) {
                            window.eventDispatcher.emit('task_completed_by_npc', { taskId });
                        }
                        result.success = true;
                        result.message = `📋 Task completed: ${taskId}`;
                        console.log('📋 Task completion tag:', taskId);
                    } else {
                        result.message = '⚠️ complete_task tag missing task ID';
                        console.warn(result.message);
                    }
                    break;

                case 'skip_task':
                    // The story closed this task off: shown as skipped, never as done
                    if (param) {
                        if (window.objectivesManager?.skipTask) {
                            window.objectivesManager.skipTask(param);
                        }
                        result.success = true;
                        result.message = `⏭️ Task skipped: ${param}`;
                        console.log('📋 Task skip tag:', param);
                    } else {
                        result.message = '⚠️ skip_task tag missing task ID';
                        console.warn(result.message);
                    }
                    break;

                case 'unlock_task':
                    if (param) {
                        const taskId = param;
                        if (window.objectivesManager) {
                            window.objectivesManager.unlockTask(taskId);
                        }
                        result.success = true;
                        result.message = `🔓 Task unlocked: ${taskId}`;
                        console.log('📋 Task unlock tag:', taskId);
                    } else {
                        result.message = '⚠️ unlock_task tag missing task ID';
                        console.warn(result.message);
                    }
                    break;

                case 'unlock_aim':
                    if (param) {
                        const aimId = param;
                        if (window.objectivesManager) {
                            window.objectivesManager.unlockAim(aimId);
                        }
                        result.success = true;
                        result.message = `🔓 Aim unlocked: ${aimId}`;
                        console.log('📋 Aim unlock tag:', aimId);
                    } else {
                        result.message = '⚠️ unlock_aim tag missing aim ID';
                        console.warn(result.message);
                    }
                    break;

                case 'set_global':
                    if (param) {
                        // Format: set_global:variableName:value
                        const parts = param.split(':');
                        const varName = parts[0]?.trim();
                        const varValue = parts[1]?.trim();
                        
                        if (!varName) {
                            result.message = '⚠️ set_global tag missing variable name';
                            console.warn(result.message);
                            break;
                        }
                        
                        // Parse value (support booleans, numbers, strings)
                        let parsedValue = varValue;
                        if (varValue === 'true') parsedValue = true;
                        else if (varValue === 'false') parsedValue = false;
                        else if (!isNaN(varValue)) parsedValue = Number(varValue);
                        
                        // Set the global variable
                        if (!window.gameState) {
                            window.gameState = {};
                        }
                        if (!window.gameState.globalVariables) {
                            window.gameState.globalVariables = {};
                        }
                        
                        const oldValue = window.gameState.globalVariables[varName];
                        window.gameState.globalVariables[varName] = parsedValue;
                        
                        console.log(`🌐 Set global variable: ${varName} = ${parsedValue} (was: ${oldValue})`);

                        // Push it into every loaded Ink story too. A bare `~ var = x`
                        // inside ink goes through variableChangedEvent, which broadcasts;
                        // this tag wrote only to gameState, so other loaded stories kept
                        // their own stale copy of the variable and could later push it
                        // back over this value when their conversation closed.
                        window.npcConversationStateManager?.broadcastGlobalVariableChange?.(
                            varName, parsedValue, null
                        );

                        // Emit event for any listeners (including NPCManager event mappings)
                        if (window.eventDispatcher) {
                            window.eventDispatcher.emit(`global_variable_changed:${varName}`, {
                                name: varName,
                                value: parsedValue,
                                oldValue: oldValue
                            });
                            console.log(`📡 Emitted event: global_variable_changed:${varName}`);
                        }
                        
                        result.success = true;
                        result.message = `🌐 Global variable set: ${varName} = ${parsedValue}`;
                    } else {
                        result.message = '⚠️ set_global tag missing parameters';
                        console.warn(result.message);
                    }
                    break;

                case 'set_variable':
                    // Format: set_variable:varName=value
                    if (param) {
                        const eqIndex = param.indexOf('=');
                        const varName = eqIndex === -1 ? param.trim() : param.substring(0, eqIndex).trim();
                        const varValueStr = eqIndex === -1 ? 'true' : param.substring(eqIndex + 1).trim();

                        if (!varName) {
                            result.message = '⚠️ set_variable tag missing variable name';
                            console.warn(result.message);
                            break;
                        }

                        // Parse value (true/false/number/string)
                        let parsedValue;
                        if (varValueStr === 'true') parsedValue = true;
                        else if (varValueStr === 'false') parsedValue = false;
                        else if (!isNaN(varValueStr) && varValueStr !== '') parsedValue = Number(varValueStr);
                        else parsedValue = varValueStr;

                        if (!window.gameState) window.gameState = {};
                        if (!window.gameState.globalVariables) window.gameState.globalVariables = {};

                        const oldValue = window.gameState.globalVariables[varName];
                        window.gameState.globalVariables[varName] = parsedValue;
                        console.log(`🌐 set_variable: ${varName} = ${parsedValue} (was: ${oldValue})`);

                        if (window.npcConversationStateManager) {
                            window.npcConversationStateManager.broadcastGlobalVariableChange(varName, parsedValue, null);
                        }
                        if (window.eventDispatcher) {
                            window.eventDispatcher.emit(`global_variable_changed:${varName}`, {
                                name: varName, value: parsedValue, oldValue
                            });
                        }

                        result.success = true;
                        result.message = `🌐 Variable set: ${varName} = ${parsedValue}`;
                    } else {
                        result.message = '⚠️ set_variable tag missing parameters';
                        console.warn(result.message);
                    }
                    break;

                default:
                    // Unknown tag, log but don't fail
                    console.log(`ℹ️ Unknown game action tag: ${action}`);
                    result.message = `ℹ️ Unknown action: ${action}`;
                    break;
            }
        } catch (error) {
            result.success = false;
            result.message = `❌ Error processing tag ${action}: ${error.message}`;
            console.error(result.message, error);
        }
        
        results.push(result);
    }

    return results;
}

/**
 * Extract and filter game action tags from a tag array
 * Game action tags are those that trigger game mechanics (not speaker tags)
 * 
 * @param {Array<string>} tags - All tags from story
 * @returns {Array<string>} Only the action tags
 */
export function getActionTags(tags) {
    if (!tags) return [];
    
    // Filter out speaker tags and keep only action tags
    return tags.filter(tag => {
        const action = tag.split(':')[0].trim().toLowerCase();
        return action !== 'player' && 
               action !== 'npc' && 
               action !== 'speaker' &&
               !action.startsWith('speaker:');
    });
}

/**
 * Determine speaker from tags
 * Finds the LAST speaker tag (most recent/current speaker)
 * 
 * @param {Array<string>} tags - Tags from story
 * @param {string} defaultSpeaker - Default speaker if not found in tags
 * @returns {string} Speaker ('npc' or 'player')
 */
export function determineSpeaker(tags, defaultSpeaker = 'npc') {
    if (!tags || tags.length === 0) return defaultSpeaker;
    
    // Check tags in REVERSE order to find the last speaker tag (current speaker)
    for (let i = tags.length - 1; i >= 0; i--) {
        const trimmed = tags[i].trim().toLowerCase();
        if (trimmed === 'player' || trimmed === 'speaker:player') {
            return 'player';
        }
        if (trimmed === 'npc' || trimmed === 'speaker:npc') {
            return 'npc';
        }
    }
    
    return defaultSpeaker;
}

/**
 * Show NPC influence change popup
 * Displays a brief notification when player's relationship with an NPC changes
 * 
 * @param {string} npcName - Display name of the NPC
 * @param {string} direction - 'increased' or 'decreased'
 */
let _influenceContainer = null;

export function showInfluencePopup(npcName, direction) {
    if (!_influenceContainer) {
        _influenceContainer = document.createElement('div');
        _influenceContainer.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            z-index: 10001;
            pointer-events: none;
        `;
        document.body.appendChild(_influenceContainer);
    }

    const symbol = direction === 'increased' ? '+' : '-';
    const color = direction === 'increased' ? '#27ae60' : '#e74c3c';

    const popup = document.createElement('div');
    popup.className = `influence-popup influence-${direction}`;
    popup.textContent = `${symbol} Influence: ${npcName}`;
    popup.style.cssText = `
        padding: 15px 30px;
        background: rgba(0, 0, 0, 0.9);
        color: ${color};
        border: 2px solid ${color};
        font-family: 'VT323', monospace;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        opacity: 0;
        transition: opacity 0.3s ease-out;
    `;

    // Prepend so new popups appear at the top, pushing older ones down
    _influenceContainer.prepend(popup);

    // Fade in
    requestAnimationFrame(() => { popup.style.opacity = '1'; });

    // Fade out and remove
    setTimeout(() => {
        popup.style.opacity = '0';
        setTimeout(() => {
            popup.remove();
            if (_influenceContainer && _influenceContainer.children.length === 0) {
                _influenceContainer.remove();
                _influenceContainer = null;
            }
        }, 300);
    }, 2000);
}
