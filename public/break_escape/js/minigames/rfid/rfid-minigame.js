/**
 * RFID Minigame Controller
 *
 * RFID Flipper-inspired RFID reader/cloner minigame:
 * - Unlock mode: Tap keycard or emulate saved card to unlock doors
 * - Clone mode: Read and save keycard data for later emulation
 *
 * Modes:
 * - unlock: Player needs to unlock an RFID-locked door
 * - clone: Player is cloning a keycard (from conversation or inventory click)
 *
 * @module rfid-minigame
 */

import { MinigameScene } from '../framework/base-minigame.js';
import { RFIDUIRenderer, clonerNameInSentence } from './rfid-ui.js';
import { RFIDDataManager } from './rfid-data.js';
import { RFIDAnimations } from './rfid-animations.js';
import { MIFAREAttackManager } from './rfid-attacks.js';
import { detectProtocol } from './rfid-protocols.js';

// A refused card stays on screen this long, or until the player taps the screen (5 s, as
// long as the shortest error toast: PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md 7).
export const DENIAL_HOLD_MS = 5000;

/** The toast after a copy is saved: what was copied, and where it is used. */
export function savedCardConfirmation(cardData) {
    const name = (cardData && cardData.name) || 'The card';
    return `${name} is saved on your ${clonerNameInSentence()}. Hold it to the card's reader to play it back.`;
}

export class RFIDMinigame extends MinigameScene {
    constructor(container, params) {
        // Set title based on mode
        const title = params.mode === 'clone' ? 'Cloning Card...' : 'RFID Reader';

        super(container, {
            ...params,
            title: title,
            showCancel: true,
            cancelText: 'Close',
            requiresKeyboardInput: false
        });

        // Parameters
        this.params = params;
        this.mode = params.mode || 'unlock'; // 'unlock' or 'clone'
        this.requiredCardIds = params.requiredCardIds || (params.requiredCardId ? [params.requiredCardId] : []); // Array of valid card IDs
        this.acceptsUIDOnly = params.acceptsUIDOnly || false; // For MIFARE DESFire UID-only emulation
        this.availableCards = params.availableCards || []; // For unlock mode
        this.hasCloner = params.hasCloner || false; // For unlock mode
        this.cardToClone = params.cardToClone; // For clone mode
        // Clone mode: where the card came from, { npc_id } or { object_id } (access model 4.2)
        this.cloneSource = params.cloneSource || null;
        this.isLockingAttempt = this.requiredCardIds.length > 0; // True if trying to unlock a specific lock, false if just browsing

        // Components
        this.ui = null;
        this.dataManager = null;
        this.animations = null;
        this.attackManager = null;

        // State
        this.gameResult = null;

        console.log(`🔐 RFIDMinigame created in ${this.mode} mode`);
    }

    init() {
        // Call parent init
        super.init();

        // Add CSS class to container
        this.container.classList.add('rfid-minigame-container');
        this.gameContainer.classList.add('rfid-minigame-game-container');

        // Initialize components
        this.dataManager = new RFIDDataManager();
        this.animations = new RFIDAnimations(this);
        this.attackManager = new MIFAREAttackManager();
        this.ui = new RFIDUIRenderer(this);

        // Create appropriate interface
        if (this.mode === 'unlock') {
            this.ui.createUnlockInterface();
        } else if (this.mode === 'clone') {
            this.ui.createCloneInterface();
        }

        console.log('🔐 RFIDMinigame initialized');
    }

    start() {
        super.start();
        console.log('🔐 RFIDMinigame started');

        // Emit event
        if (window.eventDispatcher) {
            window.eventDispatcher.emit('rfid_lock_accessed', {
                mode: this.mode,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Handle card tap (unlock mode)
     * @param {Object} card - Card that was tapped
     */
    handleCardTap(card) {
        console.log('📡 Card tapped:', card.scenarioData?.name);

        // Get card ID (standard: card_id, else the lock the card opens)
        const cardId = card.scenarioData?.card_id || window.lockRef(card.scenarioData);

        // A cancelled card (left-card consequence, §3.3b) is refused at the reader even
        // though its id still matches the lock.
        if (this.isLockingAttempt && window.isCardRevoked?.(cardId)) {
            if (window.playUISound) window.playUISound('reject');
            this.animations.showTapFailure();
            const name = card.scenarioData?.name || 'This card';
            this._showDenial('Card cancelled', () => this.ui.showTapInterface(), 'revoked',
                `${name} has been deactivated — the reader rejects it.`);
            return;
        }

        const isCorrect = !this.isLockingAttempt || this.requiredCardIds.includes(cardId);

        if (isCorrect) {
            if (window.playUISound) window.playUISound('card_scan');
            this.animations.showTapSuccess();
            this.ui.showSuccess(this.isLockingAttempt ? 'Access Granted' : 'Card Read');
            // The door's toast names the card that opened it (unlock-system.js rfidOpenedLine)
            this.gameResult = { success: true, cardName: card.scenarioData?.name || null, emulated: false };

            setTimeout(() => {
                this.complete(true);
            }, 1500);
        } else {
            if (window.playUISound) window.playUISound('reject');
            this.animations.showTapFailure();
            const name = card.scenarioData?.name || 'This card';
            this._showDenial('Access Denied', () => this.ui.showTapInterface(), 'wrong_card',
                `${name} is not the card this reader wants.`);
        }
    }

    /**
     * Show a refusal until the player taps the screen or DENIAL_HOLD_MS passes, then go
     * back(). On a door, also report it (params.onRefused: unlock-system's
     * emitDoorUnlockFailed, which emits door_unlock_failed and door_unlock_failed:<room>).
     * `detail` is a short line under the message saying why; tone 'notice' shows it in
     * amber with no cross, for "nothing happened" rather than "refused".
     */
    _showDenial(message, back, reason, detail, tone) {
        this._endDenial();
        this.ui.showError(message, detail, tone);
        const screen = this.ui.getScreen && this.ui.getScreen();
        if (screen && typeof document !== 'undefined') {
            const hint = document.createElement('div');
            hint.className = 'flipper-error-hint';
            hint.textContent = 'Tap to continue';
            const box = (screen.querySelector && screen.querySelector('.flipper-error')) || screen;
            box.appendChild(hint);
        }
        let done = false;
        const onTap = (e) => { if (e && e.stopPropagation) e.stopPropagation(); finish(); };
        const finish = () => {
            if (done) return;
            done = true;
            this._endDenial();
            back();
        };
        this._denial = {
            screen, onTap,
            timer: setTimeout(finish, DENIAL_HOLD_MS),
            // Listen from the next tick, so the click that tapped the card doesn't count
            armTimer: setTimeout(() => { if (!done && screen) screen.addEventListener('click', onTap); }, 0)
        };
        if (this.isLockingAttempt && typeof this.params.onRefused === 'function') {
            try { this.params.onRefused(reason); } catch (e) { console.warn('onRefused failed:', e); }
        }
    }

    /** Drop a pending denial (its timer and tap listener) without going back. */
    _endDenial() {
        const d = this._denial;
        if (!d) return;
        this._denial = null;
        clearTimeout(d.timer);
        clearTimeout(d.armTimer);
        if (d.screen && d.screen.removeEventListener) d.screen.removeEventListener('click', d.onTap);
    }

    /**
     * Handle card emulation (unlock mode)
     * Supports all protocols including UID-only emulation
     * @param {Object} savedCard - Saved card from cloner
     */
    handleEmulate(savedCard) {
        console.log('📡 Emulating card:', savedCard.name);

        // Get card ID (standard: card_id, else the lock the card opens)
        const cardId = savedCard.card_id || window.lockRef(savedCard);

        // Opened from the inventory: there is no reader to present the card to. Say so,
        // rather than "Card Emulated" and closing with nothing unlocked.
        if (!this.isLockingAttempt) {
            this._showDenial('No reader here', () => this.ui.showSavedCards(), 'no_reader',
                `Use the cloner at a door's card reader to emulate ${savedCard.name || 'this card'}.`, 'notice');
            return;
        }
        // A cancelled card (left-card consequence, §3.3b): the clone no longer works,
        // even though its id matches the lock. Refused at the reader.
        if (this.isLockingAttempt && window.isCardRevoked?.(cardId)) {
            if (window.playUISound) window.playUISound('reject');
            this.animations.showEmulationFailure();
            if (window.eventDispatcher) {
                window.eventDispatcher.emit('card_emulated', {
                    cardName: savedCard.name,
                    cardId: cardId,
                    protocol: savedCard.rfid_protocol || 'EM4100',
                    success: false,
                    revoked: true,
                    timestamp: Date.now()
                });
            }
            this._showDenial('Card cancelled', () => this.ui.showSavedCards(), 'revoked',
                `The clone of ${savedCard.name || 'that card'} no longer works — the card has been deactivated.`);
            return;
        }

        const isCorrect = this.requiredCardIds.includes(cardId);

        // Check if UID-only emulation (MIFARE DESFire without master key)
        const protocol = savedCard.rfid_protocol || 'EM4100';
        const isUIDOnly = protocol === 'MIFARE_DESFire' && !savedCard.rfid_data?.masterKeyKnown;

        // If UID-only and door doesn't accept it, reject (only when attempting to unlock)
        if (this.isLockingAttempt && isUIDOnly && !this.acceptsUIDOnly) {
            if (window.playUISound) window.playUISound('reject');
            this.animations.showEmulationFailure();

            // Emit event
            if (window.eventDispatcher) {
                window.eventDispatcher.emit('card_emulated', {
                    cardName: savedCard.name,
                    cardId: cardId,
                    protocol: protocol,
                    uidOnly: true,
                    readerRejectsUIDOnly: true,
                    success: false,
                    timestamp: Date.now()
                });
            }

            this._showDenial('Reader requires full authentication', () => this.ui.showSavedCards(), 'uid_only',
                'Only the UID was copied. This reader checks the card\'s encryption keys too.');
            return;
        }

        if (isCorrect) {
            if (window.playUISound) window.playUISound('card_scan');
            this.animations.showEmulationSuccess();
            this.ui.showSuccess('Access Granted');
            this.gameResult = { success: true, cardName: savedCard.name || null, emulated: true };

            // Emit event
            if (window.eventDispatcher) {
                window.eventDispatcher.emit('card_emulated', {
                    cardName: savedCard.name,
                    cardId: cardId,
                    protocol: protocol,
                    uidOnly: isUIDOnly,
                    success: true,
                    timestamp: Date.now()
                });
            }

            setTimeout(() => {
                this.complete(true);
            }, 2000);
        } else {
            if (window.playUISound) window.playUISound('reject');
            this.animations.showEmulationFailure();

            // Emit event
            if (window.eventDispatcher) {
                window.eventDispatcher.emit('card_emulated', {
                    cardName: savedCard.name,
                    cardId: cardId,
                    protocol: protocol,
                    success: false,
                    timestamp: Date.now()
                });
            }

            // The clone ran; this reader just doesn't take that card
            this._showDenial('Card not accepted', () => this.ui.showSavedCards(), 'wrong_card',
                `The clone works, but this reader doesn't take ${savedCard.name || 'that card'}.`);
        }
    }

    /**
     * Start card reading (clone mode)
     */
    startCardReading(readMs) {
        console.log('📡 Starting card read...');

        // Animate reading progress (readMs from getReadProfile: EM4100 is quickest)
        this.animations.animateReading((progress) => {
            this.ui.updateReadingProgress(progress);
        }, readMs).then(() => {
            // Reading complete - show card data
            console.log('📡 Card read complete');
            this.ui.showCardDataScreen(this.cardToClone);
        });
    }

    /**
     * Handle save card (clone mode)
     * @param {Object} cardData - Card data to save
     */
    handleSaveCard(cardData) {
        console.log('💾 Saving card:', cardData.name);

        // A MIFARE Classic card with no recovered keys can't be cloned: send the
        // player to the attack menu rather than saving an unreadable card.
        if (!this.dataManager.canClone(cardData)) {
            // Stay on the read screen, where the explanation and the
            // "Crack keys first" button remain until the player acts.
            this.ui.showCardDataScreen(cardData);
            return;
        }

        const result = this.dataManager.saveCardToCloner(cardData);

        if (result.success) {
            this.ui.showSuccess(result.message);

            // Tell the server, so the copy carries its owner's identity at access lists
            this.recordCloneOnServer(cardData);

            // Emit event
            if (window.eventDispatcher) {
                window.eventDispatcher.emit('card_cloned', {
                    cardName: cardData.name,
                    cardHex: cardData.rfid_hex,
                    timestamp: Date.now()
                });
            }

            this.gameResult = {
                success: true,
                cardSaved: true,
                cardData: cardData
            };

            setTimeout(() => {
                this.complete(true);
                // Back in the world (or the chat) nothing else shows the copy worked (shot 18)
                window.gameAlert?.(savedCardConfirmation(cardData), 'success', 'Card copied', 4000);
            }, 1500);
        } else {
            this.ui.showError(result.message);

            setTimeout(() => {
                this.ui.showCardDataScreen(cardData);
            }, 1500);
        }
    }

    /**
     * After a successful save in clone mode, record the copy on the server
     * (POST /clone_card) with the copy's source and the saved card_id. The server records
     * only the source's own card, so this never widens what a copy can do. A save with
     * no source (unlock mode, or a card with no card_id) calls nothing.
     * @param {Object} cardData - The card just saved
     * @returns {Promise|undefined} the request, when one is sent
     */
    recordCloneOnServer(cardData) {
        if (this.mode !== 'clone') return undefined;
        const source = this.cloneSource;
        const cardId = cardData && cardData.card_id;
        if (!source || !cardId) return undefined;
        const body = source.npc_id ? { npc_id: source.npc_id }
            : (source.object_id ? { object_id: source.object_id }
                : (source.held_card ? { held_card: true } : null));
        if (!body) return undefined;
        const apiClient = window.ApiClient || window.APIClient;
        if (!apiClient || typeof apiClient.cloneCard !== 'function') return undefined;
        const record = Promise.resolve()
            .then(() => apiClient.cloneCard(body, cardId))
            .then(answer => {
                console.log('💾 Card copy recorded on server:', answer && answer.recorded);
                return answer;
            })
            .catch(error => {
                console.warn('💾 Could not record card copy on server:', error && error.message);
                return null;
            });
        // An access-list unlock waits for this (unlock-system.js requestRfidAccessUnlock),
        // so a reader tapped straight after Save sees the recorded copy.
        if (typeof window !== 'undefined') {
            window.pendingCardCloneRecord = record;
            record.then(() => {
                if (window.pendingCardCloneRecord === record) window.pendingCardCloneRecord = null;
            });
        }
        return record;
    }

    /**
     * Start MIFARE key attack
     * @param {string} attackType - 'dictionary', 'darkside', or 'nested'
     * @param {Object} cardData - Card to attack
     */
    startKeyAttack(attackType, cardData) {
        console.log(`🔓 Starting ${attackType} attack on card:`, cardData.name);

        const protocol = cardData.rfid_protocol || 'EM4100';
        const uid = cardData.rfid_data?.uid;

        if (!uid) {
            console.error('No UID found for MIFARE attack');
            this.ui.showError('Invalid card data');
            return;
        }

        if (attackType === 'dictionary') {
            // Dictionary attack is instant
            const existingKeys = cardData.rfid_data?.sectors || {};
            const result = this.attackManager.dictionaryAttack(uid, existingKeys, protocol);

            // Update card data with found keys
            if (result.success) {
                cardData.rfid_data.sectors = result.foundKeys;
                this.ui.showSuccess(result.message);

                const allKeys = Object.keys(result.foundKeys).length >= 16;
                setTimeout(() => {
                    // Every sector cracked: straight to the read screen with Save, as
                    // Darkside and Nested do. Otherwise back to Info, which offers Nested.
                    if (allKeys) this.ui.showCardDataScreen(cardData);
                    else this.ui.showProtocolInfo(cardData);
                }, 1500);
            } else {
                // A miss is a result, not a fault: say what ran and what to try next, and
                // hold it long enough to read (1.5 s flashed past in m09 m-7; Darkside gets
                // a failure line too, so this one must not look like nothing happened).
                this.ui.showError('Dictionary attack found no keys',
                    String(result.message || '').replace(/^\u26A0\uFE0F?\s*/, ''), 'notice');

                setTimeout(() => {
                    this.ui.showProtocolInfo(cardData);
                }, 3000);
            }

        } else if (attackType === 'darkside') {
            // Show attack progress screen
            this.ui.showAttackProgress({
                type: 'Darkside',
                progress: 0,
                currentSector: 0,
                totalSectors: 16
            });

            // Start attack
            this.attackManager.startDarksideAttack(uid, (progressData) => {
                this.ui.updateAttackProgress(progressData);
            }, protocol).then((result) => {
                // Update card data with found keys
                cardData.rfid_data.sectors = result.foundKeys;

                this.ui.showSuccess(result.message);

                setTimeout(() => {
                    // Show card data - now fully readable
                    this.ui.showCardDataScreen(cardData);
                }, 1500);
            }).catch((error) => {
                console.error('Darkside attack error:', error);
                this.ui.showError('Attack failed');
            });

        } else if (attackType === 'nested') {
            // Show attack progress screen
            const knownKeys = cardData.rfid_data?.sectors || {};
            const sectorsToFind = 16 - Object.keys(knownKeys).length;

            this.ui.showAttackProgress({
                type: 'Nested',
                progress: 0,
                sectorsRemaining: sectorsToFind
            });

            // Start attack
            this.attackManager.startNestedAttack(uid, knownKeys, (progressData) => {
                this.ui.updateAttackProgress(progressData);
            }).then((result) => {
                // Update card data with found keys
                cardData.rfid_data.sectors = result.foundKeys;

                this.ui.showSuccess(result.message);

                setTimeout(() => {
                    // Show card data - now fully readable
                    this.ui.showCardDataScreen(cardData);
                }, 1500);
            }).catch((error) => {
                console.error('Nested attack error:', error);
                this.ui.showError(error.message || 'Attack failed');
            });
        }
    }

    complete(success) {
        // Check if we need to return to conversation
        if (window.pendingConversationReturn && window.returnToConversationAfterRFID) {
            console.log('Returning to conversation after RFID minigame');
            setTimeout(() => {
                window.returnToConversationAfterRFID();
            }, 100);
        }

        // Call parent complete
        super.complete(success, this.gameResult);
    }

    cleanup() {
        this._endDenial();

        // Cleanup animations
        if (this.animations) {
            this.animations.cleanup();
        }

        // Cleanup attacks
        if (this.attackManager) {
            this.attackManager.cleanup();
        }

        // Call parent cleanup
        super.cleanup();
        console.log('🧹 RFIDMinigame cleanup complete');
    }
}

/**
 * Start RFID minigame
 * @param {Object} lockable - The locked object (for unlock mode)
 * @param {string} type - 'door' or 'item' (for unlock mode)
 * @param {Object} params - Minigame parameters
 */
export function startRFIDMinigame(lockable, type, params) {
    console.log('🔐 Starting RFID minigame', { mode: params.mode, params });

    // Initialize framework if needed
    if (!window.MinigameFramework.mainGameScene && window.game) {
        window.MinigameFramework.init(window.game);
    }

    // Start minigame
    window.MinigameFramework.startMinigame('rfid', null, params);
}

/**
 * Return to conversation after RFID minigame
 * Follows exact pattern from container minigame
 * @see /js/minigames/container/container-minigame.js:720-754
 */
export function returnToConversationAfterRFID() {
    console.log('Returning to conversation after RFID minigame');

    // Check if there's a pending conversation return
    if (window.pendingConversationReturn) {
        const conversationState = window.pendingConversationReturn;

        // Clear the pending return state
        window.pendingConversationReturn = null;

        console.log('Restoring conversation:', conversationState);

        // Restart the appropriate conversation minigame
        if (window.MinigameFramework) {
            // Small delay to ensure RFID minigame is fully closed
            setTimeout(() => {
                if (conversationState.type === 'person-chat') {
                    // Restart person-chat minigame
                    window.MinigameFramework.startMinigame('person-chat', null, {
                        npcId: conversationState.npcId,
                        fromTag: true  // Flag to indicate resuming from tag action
                    });
                } else if (conversationState.type === 'phone-chat') {
                    // Restart phone-chat minigame
                    window.MinigameFramework.startMinigame('phone-chat', null, {
                        npcId: conversationState.npcId,
                        fromTag: true
                    });
                }
            }, 50);
        }
    } else {
        console.log('No pending conversation return found');
    }
}
