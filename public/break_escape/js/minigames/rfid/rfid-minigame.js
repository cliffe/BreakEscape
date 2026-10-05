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
import { RFIDUIRenderer } from './rfid-ui.js';
import { RFIDDataManager } from './rfid-data.js';
import { RFIDAnimations } from './rfid-animations.js';
import { MIFAREAttackManager } from './rfid-attacks.js';
import { detectProtocol } from './rfid-protocols.js';

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
        const isCorrect = !this.isLockingAttempt || this.requiredCardIds.includes(cardId);

        if (isCorrect) {
            if (window.playUISound) window.playUISound('card_scan');
            this.animations.showTapSuccess();
            this.ui.showSuccess(this.isLockingAttempt ? 'Access Granted' : 'Card Read');

            setTimeout(() => {
                this.complete(true);
            }, 1500);
        } else {
            if (window.playUISound) window.playUISound('reject');
            this.animations.showTapFailure();
            this.ui.showError('Access Denied');

            setTimeout(() => {
                this.ui.showTapInterface();
            }, 1500);
        }
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
        const isCorrect = !this.isLockingAttempt || this.requiredCardIds.includes(cardId);

        // Check if UID-only emulation (MIFARE DESFire without master key)
        const protocol = savedCard.rfid_protocol || 'EM4100';
        const isUIDOnly = protocol === 'MIFARE_DESFire' && !savedCard.rfid_data?.masterKeyKnown;

        // If UID-only and door doesn't accept it, reject (only when attempting to unlock)
        if (this.isLockingAttempt && isUIDOnly && !this.acceptsUIDOnly) {
            if (window.playUISound) window.playUISound('reject');
            this.animations.showEmulationFailure();
            this.ui.showError('Reader requires full authentication');

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

            setTimeout(() => {
                this.ui.showSavedCards();
            }, 2000);
            return;
        }

        if (isCorrect) {
            if (window.playUISound) window.playUISound('card_scan');
            this.animations.showEmulationSuccess();
            this.ui.showSuccess(this.isLockingAttempt ? 'Access Granted' : 'Card Emulated');

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
        } else if (this.isLockingAttempt) {
            // Only show "Access Denied" when actually trying to unlock a door
            if (window.playUISound) window.playUISound('reject');
            this.animations.showEmulationFailure();
            this.ui.showError('Access Denied');

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

            setTimeout(() => {
                this.ui.showSavedCards();
            }, 1500);
        } else {
            // When just browsing, show card info instead of error
            this.ui.showSuccess(`Card Info: ${savedCard.name} (${protocol})`);

            setTimeout(() => {
                this.ui.showSavedCards();
            }, 1500);
        }
    }

    /**
     * Start card reading (clone mode)
     */
    startCardReading() {
        console.log('📡 Starting card read...');

        // Animate reading progress
        this.animations.animateReading((progress) => {
            this.ui.updateReadingProgress(progress);
        }).then(() => {
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
            }, 1500);
        } else {
            this.ui.showError(result.message);

            setTimeout(() => {
                this.ui.showCardDataScreen(cardData);
            }, 1500);
        }
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
                this.ui.showError(result.message);

                setTimeout(() => {
                    this.ui.showProtocolInfo(cardData);
                }, 1500);
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
