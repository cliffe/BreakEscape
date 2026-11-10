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
import { appendLockedHint, lockedHintDuration, showLockedHintToast } from '../utils/locked-hint.js';
import { startFingerprintReader } from '../minigames/biometrics/fingerprint-reader-minigame.js';
import { catchLockpickInView } from './lockpick-catch.js';

// Helper function to notify server of unlock and get room/container data
export async function notifyServerUnlock(lockable, type, method) {
    let serverResponse;
    const apiClient = window.ApiClient || window.APIClient;
    const gameId = window.breakEscapeConfig?.gameId;

    if (apiClient && gameId) {
        try {
            // Get target ID
            const targetId = unlockTargetId(lockable, type);

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

// The id the server knows a lock by: a door's connected room, or the object's id.
function unlockTargetId(lockable, type) {
    if (type === 'door') {
        return lockable.doorProperties?.connectedRoom || lockable.doorProperties?.roomId;
    }
    return lockable.scenarioData?.id || lockable.scenarioData?.name || lockable.objectId;
}

// Helper function to check if two rectangles overlap
function boundsOverlap(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

/**
 * What RFID credentials the player currently holds for a lock's `requires` (a card id
 * or an array of them). Shared by the rfid unlock path below and the gate clone-as-entry
 * path (doors.js), so both agree on what counts as a valid card or clone.
 *
 * A match is a physical keycard, or a card saved on an rfid_cloner, whose id is one of
 * the required ids. A card's id is its explicit `card_id`, else the lock it opens
 * (window.lockRef) — the same rule everywhere.
 */
export function evaluateRfidCredential(requires) {
    const requiredCardIds = Array.isArray(requires) ? requires : [requires];
    const items = (window.inventory && window.inventory.items) || [];
    const getCardId = (cardData) => cardData.card_id || window.lockRef(cardData);
    // A cancelled card_id (left-card consequence, §3.3b) no longer counts — neither the
    // physical keycard nor a saved clone of it. The card still shows in the reader/cloner
    // UI (so the player sees it refused there too, handled in rfid-minigame.js); it just
    // never satisfies the lock.
    const revoked = (id) => (typeof window !== 'undefined' && window.isCardRevoked) ? window.isCardRevoked(id) : false;

    const keycards = items.filter(item =>
        item && item.scenarioData && item.scenarioData.type === 'keycard');
    const matchingKeycard = keycards.find(card =>
        requiredCardIds.includes(getCardId(card.scenarioData)) && !revoked(getCardId(card.scenarioData)));

    const cloner = items.find(item =>
        item && item.scenarioData && item.scenarioData.type === 'rfid_cloner');
    const savedCards = (cloner && cloner.scenarioData && cloner.scenarioData.saved_cards) || [];
    const hasValidClone = savedCards.some(card =>
        requiredCardIds.includes(getCardId(card)) && !revoked(getCardId(card)));

    return {
        requiredCardIds,
        keycards,
        matchingKeycard,
        hasValidCard: !!matchingKeycard,
        cloner,
        hasCloner: !!cloner,
        savedCards,
        hasValidClone
    };
}

/** True when the player holds a keycard or saved clone satisfying `requires`. */
export function playerHoldsRfidCredentialFor(requires) {
    if (requires == null) return false;
    const r = evaluateRfidCredential(requires);
    return r.hasValidCard || r.hasValidClone;
}

/** True when an rfid lock carries an access list (roles or people, access model 4.1). */
export function hasRfidAccessList(lockRequirements) {
    const access = lockRequirements && lockRequirements.access;
    return !!access && typeof access === 'object' && !Array.isArray(access);
}

/**
 * Every card id the player holds, for an rfid lock with an access list: the keycards
 * in the inventory and the cards saved on a card copier, each id once. A card's id is
 * worked out as evaluateRfidCredential does. The client never resolves a card to its
 * owner's roles: the server does, because the admitted NPC may be in a room the client
 * has not loaded (access model 4.1).
 */
export function heldRfidCardIds() {
    const items = (window.inventory && window.inventory.items) || [];
    const getCardId = (cardData) => cardData.card_id || window.lockRef(cardData);
    const ids = [];
    const add = (cardData) => {
        if (!cardData) return;
        const id = getCardId(cardData);
        if (id != null && id !== '' && !ids.includes(String(id))) ids.push(String(id));
    };
    items.forEach(item => {
        if (item && item.scenarioData && item.scenarioData.type === 'keycard') add(item.scenarioData);
    });
    items.forEach(item => {
        if (item && item.scenarioData && item.scenarioData.type === 'rfid_cloner') {
            (item.scenarioData.saved_cards || []).forEach(add);
        }
    });
    return ids;
}

/**
 * Ask the server to open an rfid lock with an access list, sending every held card id in
 * one request. Resolves to { outcome, response }: 'unlocked' (response is the server's
 * answer), 'uid_only' (a held card would pass but is a UID-only copy and the lock does
 * not take one), 'denied' (any other refusal) or 'error' (no answer from the server).
 */
export async function requestRfidAccessUnlock(lockable, type, cardIds) {
    const apiClient = window.ApiClient || window.APIClient;
    if (!apiClient) return { outcome: 'error', response: null };
    // A card copy saved a moment ago is still being recorded (rfid-minigame.js
    // recordCloneOnServer): wait for it, or the server refuses the copy it has not seen.
    const pendingRecord = window.pendingCardCloneRecord;
    if (pendingRecord && typeof pendingRecord.then === 'function') {
        try { await pendingRecord; } catch (e) { /* the record's own failure is logged there */ }
    }
    try {
        const response = await apiClient.unlock(type, unlockTargetId(lockable, type), null, 'rfid',
            { card_ids: cardIds });
        if (response && response.success) return { outcome: 'unlocked', response };
        return { outcome: response && response.reason === 'uid_only' ? 'uid_only' : 'denied', response };
    } catch (error) {
        if (error && error.status) {
            const body = error.body || {};
            return { outcome: body.reason === 'uid_only' ? 'uid_only' : 'denied', response: body };
        }
        console.error('RFID access list unlock failed:', error);
        return { outcome: 'error', response: null };
    }
}

// ── Sign-in PCs (access model 5.3, step 8) ─────────────────────────────────
// A `lockType: "login"` PC is opened by a session, never by unlockTarget: the PC stays
// locked in every room response, so the next click comes back here. pc-sessions.js
// (window.pcSessions) holds the sessions and does every sign-in and sign-out.

/** True for a sign-in PC object (not a door). */
export function isLoginPc(lockable, type = 'item') {
    return type !== 'door' && lockable?.scenarioData?.lockType === 'login';
}

/** Open a sign-in PC: its desktop when the client holds a session there, else the sign-in screen. */
export function openLoginPc(lockable) {
    const pcId = lockable?.scenarioData?.id;
    if (pcId && window.pcSessions?.has(pcId)) {
        openLoginDesktop(lockable);
    } else {
        openLoginSignIn(lockable);
    }
}

/**
 * A click on a sign-in PC (access model 5.4, "The interaction at a sign-in PC"):
 *   1. owned and the owner present: "<owner> is using this PC", then the PC's resolved
 *      observations, and stop (no workstation event; pc_in_use for task mappings);
 *   2. a session held here: the desktop;
 *   3. workstationState.onInteract: 'accessed' claims the owner's session through
 *      pc-sessions.js (the desktop on success, the sign-in screen on a refusal); anything
 *      else ('locked', 'signin', 'attended' from a race with step 1, null) the sign-in screen.
 * Resolves to what it did: 'in_use' | 'desktop' | 'claimed' | 'claim_refused' | 'signin'.
 */
export async function interactLoginPc(lockable) {
    const data = lockable?.scenarioData || {};
    const pcId = data.id;
    if (!pcId) return 'none';
    const ws = window.workstationState;
    const sessions = window.pcSessions;
    const { ownerId, present } = ws?.presence ? ws.presence(pcId) : { ownerId: null, present: null };
    if (ownerId && present) {
        const owner = window.npcManager?.getNPC?.(ownerId);
        const name = owner?.displayName || ownerId;
        let obs = data.observations || '';
        try {
            const { resolveObjectField } = await import('../utils/conditional-text.js');
            obs = resolveObjectField(data, 'observations', '') || '';
        } catch (e) { /* unresolved base observations */ }
        const message = obs ? `${name} is using this PC.\n${obs}` : `${name} is using this PC.`;
        window.gameAlert?.(message, 'info', data.name || 'PC', 4000);
        sessions?.inUseShown?.(pcId, ownerId);
        return 'in_use';
    }
    if (sessions?.has?.(pcId)) {
        openLoginDesktop(lockable);
        return 'desktop';
    }
    let answer = null;
    if (ws?.onInteract) {
        try { answer = ws.onInteract(pcId); } catch (e) { console.warn('workstationState.onInteract failed', e); }
    }
    if (answer === 'accessed' && sessions?.claim) {
        const r = await sessions.claim(pcId);
        if (r?.ok) {
            openLoginDesktop(lockable);
            return 'claimed';
        }
        if (r?.reason === 'owner_returned') {
            // The owner sat back down while the claim was answered: as step 1, no screen
            window.gameAlert?.(r.message, 'info', data.name || 'PC', 4000);
            return 'in_use';
        }
        if (r?.reason === 'auto_locked') {
            // The screen locked while the claim was answered: a locked screen is the sign-in
            // screen, as a click after the lock would find
            window.gameAlert?.(r.message, 'info', data.name || 'PC', 4000);
            openLoginSignIn(lockable, { reason: 'locked' });
            return 'signin';
        }
        openLoginSignIn(lockable, { reason: 'claim_refused' });
        return 'claim_refused';
    }
    openLoginSignIn(lockable, { reason: answer || 'direct' });
    return 'signin';
}

/** The desktop for the current session (container-minigame fetches it from the server). */
export function openLoginDesktop(lockable) {
    if (typeof window.startContainerMinigame === 'function') {
        window.startContainerMinigame(lockable, null, false, true);
    } else {
        console.error('Container minigame not available for the sign-in desktop');
    }
}

/**
 * The sign-in screen: the password minigame in sign-in mode, with the account tiles
 * refreshed from GET /login_accounts every time it opens (5.3: "known" changes as the
 * player explores). `switching`: opened from the desktop's Switch user, so leaving it
 * without a new sign-in returns to the desktop of the session that is still there.
 * The screen has no attempt limit of its own; the server counts failures.
 */
export async function openLoginSignIn(lockable, { switching = false, reason = undefined } = {}) {
    const data = lockable?.scenarioData || {};
    const pcId = data.id;
    if (!pcId) return;
    const sessions = window.pcSessions;
    let tiles = Array.isArray(data.loginAccounts) ? data.loginAccounts : [];
    const apiClient = window.ApiClient || window.APIClient;
    if (apiClient?.loginAccounts && window.breakEscapeConfig?.gameId) {
        try {
            const answer = await apiClient.loginAccounts(pcId);
            if (Array.isArray(answer?.loginAccounts)) {
                tiles = answer.loginAccounts;
                data.loginAccounts = tiles;
            }
        } catch (error) {
            if (error?.status === 403 || error?.status === 404) {
                window.gameAlert?.("This PC can't be reached", 'error', data.name || 'Sign in', 3000);
                return;
            }
            console.warn('Could not refresh the account tiles; using the room data', error);
        }
    }

    const framework = window.MinigameFramework;
    if (!framework) {
        console.error('MinigameFramework not available for the sign-in screen');
        return;
    }
    if (!framework.mainGameScene && window.game) framework.init(window.game);

    const picker = data.loginPicker === undefined || data.loginPicker === null ? 'accounts' : data.loginPicker;
    sessions?.screenShown?.(pcId, picker === false ? [] : tiles, switching ? 'switch' : reason);
    framework.startMinigame('password', null, {
        title: data.name || 'Sign in',
        lockable,
        type: 'item',
        signIn: {
            pcId,
            pcName: data.name || pcId,
            picker,
            tiles: picker === false ? [] : tiles,
            current: sessions?.get?.(pcId) || null
        },
        postitNote: data.postitNote || '',
        showPostit: !!data.postitNote && data.showPostit !== false,
        requiresKeyboardInput: true,
        onComplete: (success) => {
            const signedIn = !!sessions?.has?.(pcId);
            if ((success && signedIn) || (switching && signedIn)) {
                openLoginDesktop(lockable);
            }
        }
    });
}

export function handleUnlock(lockable, type) {
    console.log('UNLOCK ATTEMPT');
    playUISound('lock');

    // A sign-in PC never goes through unlockTarget (not even with locks disabled): its
    // session opens it (5.3).
    if (isLoginPc(lockable, type)) {
        openLoginPc(lockable);
        return;
    }
    
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
    
    // A refusal that came from inside a lock's own overlay (fingerprint reader, RFID cloner):
    // report it, then show the door's lockedHint (if it has one) as the refusal toast.
    const refusedWithHint = (reason) => {
        emitDoorUnlockFailed(reason);
        showLockedHintToast(lockable);
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
                // (same gate as "Switch to Lockpicking" in the key minigame)
                if (catchLockpickInView(lockable)) {
                    return;  // Don't start lockpicking minigame
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
                
                startLockpickingMinigame(lockable, window.game, difficulty, async (success, outcome) => {
                    if (success) {
                        // Notify server of successful lockpick to update player_state and get room/container data
                        const serverResponse = await notifyServerUnlock(lockable, type, 'lockpick');
                        setTimeout(() => {
                            unlockTarget(lockable, type, lockable.layer, serverResponse);
                            window.gameAlert(`Successfully picked the lock!`, 'success', 'Lock Picked', 4000);
                        }, 100);
                    } else {
                        console.log('LOCKPICK FAILED');
                        // Closing the minigame (outcome.cancelled) is not a failed attempt: no toast
                        if (!outcome?.cancelled && !window.minigameClosedByDamage?.()) {
                            window.gameAlert('Failed to pick the lock. Try again.', 'error', 'Pick Failed', 3000);
                        }
                    }
                }, keyPins);  // Pass keyPins to minigame starter
            } else {
                console.log('NO KEYS OR LOCKPICK AVAILABLE');
                emitDoorUnlockFailed('no_key');
                // Opt-in hint: a scenario may author `lockedHint` on the door/room to tell the
                // player where the key comes from (SE lab F17). Doors without it keep the plain
                // "Requires key" line unchanged, so shipped missions behave exactly as before.
                window.gameAlert(appendLockedHint('Requires key', lockable), 'error', 'Locked', lockedHintDuration(lockable, 4000, 'Requires key'));
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
            // Doors keep their options on doorProperties; containers use scenarioData.
            const pwDoor = lockable.doorProperties || {};
            const passwordOptions = {
                passwordHint: lockable.passwordHint || lockable.scenarioData?.passwordHint || pwDoor.passwordHint || '',
                showHint: lockable.showHint || lockable.scenarioData?.showHint || pwDoor.showHint || false,
                showKeyboard: lockable.showKeyboard || lockable.scenarioData?.showKeyboard || pwDoor.showKeyboard || false,
                maxAttempts: lockable.maxAttempts || lockable.scenarioData?.maxAttempts || pwDoor.maxAttempts || 3,
                postitNote: lockable.postitNote || lockable.scenarioData?.postitNote || pwDoor.postitNote || '',
                showPostit: lockable.showPostit || lockable.scenarioData?.showPostit || pwDoor.showPostit || false,
                // A wrong password at a door: door_unlock_failed (reason wrong_password,
                // or wrong_password_case when only the letter case was wrong)
                onRefused: emitDoorUnlockFailed
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
            }, refusedWithHint);
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

            // Support both single card ID (legacy) and array of card IDs, and find any
            // matching physical keycard or saved clone — shared with the gate
            // clone-as-entry path (evaluateRfidCredential). A lock with an access list
            // and no `requires` has no specific card, so nothing can match step 1.
            const rfidHasRequires = lockRequirements.requires != null && lockRequirements.requires !== '' &&
                !(Array.isArray(lockRequirements.requires) && lockRequirements.requires.length === 0);
            const {
                requiredCardIds, keycards, matchingKeycard, hasValidCard,
                cloner, hasCloner, savedCards, hasValidClone
            } = evaluateRfidCredential(hasRfidAccessList(lockRequirements) && !rfidHasRequires
                ? [] : lockRequirements.requires);

            // Check if door accepts UID-only emulation (for DESFire cards)
            const acceptsUIDOnly = lockRequirements.acceptsUIDOnly || false;

            console.log('RFID CARD REQUIRED', requiredCardIds, 'acceptsUIDOnly:', acceptsUIDOnly);

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

            const playRfidUnlockSound = () => {
                // Play electric strike sound alongside door open
                try {
                    if (window.game && window.game.sound) {
                        const s = window.game.sound.get('rfid_unlock') || window.game.sound.add('rfid_unlock');
                        s.play({ volume: 0.9 });
                    }
                } catch (e) {}
            };

            // The card copier's reader screen: tap a held card or emulate a saved one
            const startRfidReader = () => {
                // Start RFID minigame in unlock mode
                window.startRFIDMinigame(lockable, type, {
                    mode: 'unlock',
                    requiredCardIds: requiredCardIds,
                    acceptsUIDOnly: acceptsUIDOnly,
                    availableCards: keycards,  // Cards they can read in the minigame
                    hasCloner: hasCloner,
                    // A refused card or clone at the reader: door_unlock_failed (reason
                    // wrong_card or uid_only), same as a refused key or fingerprint
                    onRefused: refusedWithHint,
                    onComplete: async (success) => {
                        if (success) {
                            // Notify server and get room/container data
                            const serverResponse = await notifyServerUnlock(lockable, type, 'rfid');
                            setTimeout(() => {
                                playRfidUnlockSound();
                                unlockTarget(lockable, type, lockable.layer, serverResponse);
                                window.gameAlert('RFID lock unlocked!', 'success', 'Access Granted', 3000);
                            }, 100);
                        }
                    }
                });
            };

            // Access model 4.1: a lock with an access list (roles or people) is decided by
            // the server from every card id the player holds.
            const accessCardIds = hasRfidAccessList(lockRequirements) ? heldRfidCardIds() : [];

            // STEP 1a: a held keycard matches `requires` - open directly (today's rule)
            if (hasValidCard) {
                const cardName = matchingKeycard.scenarioData.name || 'Keycard';
                console.log(`RFID DIRECT UNLOCK with physical keycard: ${cardName}`);
                
                // Notify server and unlock
                notifyServerUnlock(lockable, type, 'rfid').then(serverResponse => {
                    playRfidUnlockSound();
                    unlockTarget(lockable, type, lockable.layer, serverResponse);
                    window.gameAlert(`Door opened with ${cardName}`, 'success', 'Access Granted', 3000);
                }).catch(error => {
                    console.error('RFID unlock failed:', error);
                    window.gameAlert('Access denied', 'error', 'Error', 3000);
                });
            }
            // STEP 1b: a saved copy matches `requires` - the reader, where the minigame
            // applies the lock's acceptsUIDOnly itself (today's rule)
            else if (hasValidClone) {
                startRfidReader();
            }
            // STEP 2: the lock has an access list - send every held card id in one request
            // and show the server's answer
            else if (accessCardIds.length > 0) {
                console.log('RFID ACCESS LIST: asking the server', { cards: accessCardIds.length });
                requestRfidAccessUnlock(lockable, type, accessCardIds).then(({ outcome, response }) => {
                    if (outcome === 'unlocked') {
                        // Container contents come back with an object unlock
                        if (response.hasContents && response.contents && lockable.scenarioData) {
                            lockable.scenarioData.contents = response.contents;
                        }
                        playRfidUnlockSound();
                        unlockTarget(lockable, type, lockable.layer, response);
                        window.gameAlert('Card accepted', 'success', 'Access Granted', 3000);
                    } else if (outcome === 'uid_only') {
                        playUISound('reject');
                        window.gameAlert(appendLockedHint('Reader requires full authentication', lockable), 'error', 'Access Denied', lockedHintDuration(lockable, 4000, 'Reader requires full authentication'));
                        emitDoorUnlockFailed('uid_only');
                    } else if (outcome === 'denied') {
                        playUISound('reject');
                        window.gameAlert(appendLockedHint('Access denied', lockable), 'error', 'Access Denied', lockedHintDuration(lockable, 4000, 'Access denied'));
                        emitDoorUnlockFailed('wrong_card');
                    } else {
                        window.gameAlert('Failed to verify access', 'error', 'Error', 3000);
                    }
                });
            }
            // STEP 3: today's flow. A cloner with nothing to offer (no keycards to tap, no
            // saved clones): the reader just refuses, rather than opening an empty cloner
            // screen (m07 U9)
            else if (hasCloner && keycards.length === 0 && savedCards.length === 0) {
                console.log('RFID CLONER EMPTY: no keycards, no saved cards');
                window.gameAlert(appendLockedHint('Access denied. No keycard, and nothing saved on the cloner.', lockable), 'error', 'Access Denied', lockedHintDuration(lockable, 4000, 'Access denied. No keycard, and nothing saved on the cloner.'));
                emitDoorUnlockFailed('no_card');
            }
            // If player has RFID cloner, open minigame to emulate or read cards
            else if (hasCloner) {
                startRfidReader();
            }
            // No valid keycard and no cloner
            else {
                console.log('NO RFID CARDS OR CLONER AVAILABLE');
                window.gameAlert(appendLockedHint('Requires RFID keycard', lockable), 'error', 'Access Denied', lockedHintDuration(lockable, 4000, 'Requires RFID keycard'));
                emitDoorUnlockFailed('no_card');
            }
            break;

        default:
            window.gameAlert(appendLockedHint(`This ${type} requires ${lockRequirements.lockType} to unlock.`, lockable), 'info', 'Locked', lockedHintDuration(lockable, 4000, `This ${type} requires ${lockRequirements.lockType} to unlock.`));
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
                difficulty: props.difficulty,
                access: props.access ?? null,  // rfid access list (access model 4.1)
                acceptsUIDOnly: props.acceptsUIDOnly ?? null
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
                locked: roomData?.locked,
                access: roomData?.access ?? null,
                acceptsUIDOnly: roomData?.acceptsUIDOnly ?? null
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
            difficulty: targetRoom.difficulty,
            access: targetRoom.access,
            acceptsUIDOnly: targetRoom.acceptsUIDOnly
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
        difficulty: item.scenarioData.difficulty,
        access: item.scenarioData.access ?? null,  // rfid access list (access model 4.1)
        acceptsUIDOnly: item.scenarioData.acceptsUIDOnly ?? null
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
window.openLoginPc = openLoginPc;
window.interactLoginPc = interactLoginPc;
window.openLoginSignIn = openLoginSignIn;

