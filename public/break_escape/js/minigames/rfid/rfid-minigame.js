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

// The close X sits inside the copier's frame (UI design language: the X is inside the frame,
// never on its border). From the frame's outer edge: 2px outline, 2px bevel, then the body,
// whose own corner steps reach 10px further in. 12px from the top and right clears all of it.
export const COPIER_CLOSE_INSET = 12;
// The battery keeps this gap from the X
export const COPIER_CLOSE_GAP = 8;

export class RFIDMinigame extends MinigameScene {
    // The X goes inside the frame (MinigameScene.closeInsideFrame), placed by the copier's
    // own placeCloseButton below
    static closeInsideFrame = true;

    constructor(container, params) {
        // Set title based on mode
        const title = params.mode === 'clone' ? 'Cloning Card...' : 'RFID Reader';

        // No Cancel button: minigames close with the X (and Esc) only (UX slice 3a R2 m2).
        // The base constructor keeps this merged object as this.params; it is not replaced
        // with the caller's own params, or showCancel would fall back to the default.
        super(container, {
            ...params,
            title: title,
            showCancel: false,
            requiresKeyboardInput: false
        });

        // Parameters
        this.mode = params.mode || 'unlock'; // 'unlock' or 'clone'
        this.requiredCardIds = params.requiredCardIds || (params.requiredCardId ? [params.requiredCardId] : []); // Array of valid card IDs
        this.acceptsUIDOnly = params.acceptsUIDOnly || false; // For MIFARE DESFire UID-only emulation
        this.availableCards = params.availableCards || []; // For unlock mode
        this.hasCloner = params.hasCloner || false; // For unlock mode
        this.cardToClone = params.cardToClone; // For clone mode
        // Clone mode: the source. Chat clones pass cloneSource { npc_id }; every other clone
        // passes cloneFrom 'world' | 'inventory', and recordCloneOnServer builds the body from
        // it and the card's id (SYNC_DELTAS_PLAN 5.2, access model 4.2).
        this.cloneSource = params.cloneSource || null;
        this.cloneFrom = params.cloneFrom || null;
        // At a lock with an access list (UX slice 3b) the server decides: each Emulate or
        // tap sends that one card's id through params.requestAccess (unlock-system.js
        // requestRfidAccessUnlock) and follows the answer. Such a lock may have no
        // `requires` at all, so it still counts as a reader.
        this.accessList = params.accessList === true && typeof params.requestAccess === 'function';
        this._accessPending = false;
        // True if trying to unlock a specific lock, false if just browsing
        this.isLockingAttempt = this.requiredCardIds.length > 0 || this.accessList;

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

    // The copier's frame holds the X
    closeAnchor() {
        return this.gameContainer?.querySelector?.('.flipper-zero-frame') || this.gameContainer;
    }

    /**
     * The X inside the copier frame at its top right, at every window size: clear of the
     * stepped corner (COPIER_CLOSE_INSET), level with the header's name line, and the
     * header's battery moved left so it never sits under the X. Re-run on resize and when
     * the frame changes size (MinigameScene._watchCloseButton).
     */
    placeCloseButton() {
        const btn = this.container?.querySelector?.('#minigame-close');
        const frame = this.closeAnchor();
        if (!btn || !frame?.getBoundingClientRect || btn.style.display === 'none') return;
        const r = frame.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const c = this.container.getBoundingClientRect();
        const b = btn.getBoundingClientRect();
        const header = frame.querySelector?.('.flipper-header');
        if (header) header.style.paddingRight = '';
        const h = header ? header.getBoundingClientRect() : null;
        const frameTop = Math.max(r.top, c.top);
        let top = frameTop + COPIER_CLOSE_INSET;
        // Level with the header's name line (its box less the rule under it)
        if (h && h.height && b.height) {
            const cs = window.getComputedStyle ? window.getComputedStyle(header) : null;
            const below = cs ? (parseFloat(cs.paddingBottom) || 0) + (parseFloat(cs.borderBottomWidth) || 0) : 0;
            top = Math.max(top, h.top + (h.height - below - b.height) / 2);
        }
        const right = c.right - Math.min(r.right, c.right) + COPIER_CLOSE_INSET;
        btn.style.top = `${Math.round(top - c.top)}px`;
        btn.style.right = `${Math.round(right)}px`;
        btn.classList.add('minigame-close-in-frame', 'rfid-close-in-frame');
        // Keep the battery clear of the X
        if (header && h && b.width) {
            const xLeft = c.right - right - b.width;
            const reserve = Math.round(h.right - xLeft + COPIER_CLOSE_GAP);
            if (reserve > 0) header.style.paddingRight = `${reserve}px`;
        }
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

        // The copier's own Read, from the inventory (no reader): a held card picked there is
        // read for copying, as when the card itself is clicked in the inventory.
        if (!this.isLockingAttempt && this.hasCloner && card && card.scenarioData) {
            return this.startHeldCardRead(card);
        }

        // Get card ID (standard: card_id, else the lock the card opens)
        const cardId = card.scenarioData?.card_id || window.lockRef(card.scenarioData);

        // A cancelled card (left-card consequence, §3.3b) is refused at the reader even
        // though its id still matches the lock.
        if (this.isLockingAttempt && window.isCardRevoked?.(cardId)) {
            if (window.playUISound) window.playUISound('reject');
            this.animations.showTapFailure();
            const name = card.scenarioData?.name || 'This card';
            this._showDenial('Card cancelled', () => this.ui.showTapInterface(), 'revoked',
                `${name} has been deactivated. The reader rejects it.`);
            return;
        }

        // At an access list the server decides for this one card
        if (this.accessList) {
            const name = card.scenarioData?.name || null;
            this._askAccessList(cardId, {
                cardName: name,
                emulated: false,
                back: () => this.ui.showTapInterface(),
                deniedTitle: 'Access Denied',
                deniedDetail: `${name || 'This card'} is not cleared for this reader.`
            });
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
     * Read a held keycard for copying, from the copier's Read list. The copier becomes a
     * clone of that card: the same read, result, Save and server record as a held card
     * clicked in the inventory (interactions.js, cloneFrom 'inventory').
     * @param {Object} card - an inventory keycard item ({ scenarioData })
     */
    startHeldCardRead(card) {
        this.mode = 'clone';
        this.cardToClone = card.scenarioData;
        this.cloneFrom = 'inventory';
        this.cloneSource = null;
        this.ui.showReadingScreen();
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
        // Enter or Space continues too (R5 n1): the screen takes the focus while it shows
        const onKey = (e) => {
            if (!e || (e.key !== 'Enter' && e.key !== ' ')) return;
            if (e.preventDefault) e.preventDefault();
            onTap(e);
        };
        const finish = () => {
            if (done) return;
            done = true;
            this._endDenial();
            back();
        };
        this._denial = {
            screen, onTap, onKey,
            timer: setTimeout(finish, DENIAL_HOLD_MS),
            // Listen from the next tick, so the click (or Enter) that tapped the card doesn't count
            armTimer: setTimeout(() => {
                if (done || !screen) return;
                screen.addEventListener('click', onTap);
                screen.addEventListener('keydown', onKey);
                if (typeof screen.focus === 'function') {
                    screen.setAttribute?.('tabindex', '-1');
                    try { screen.focus({ preventScroll: true }); } catch (e) { /* not focusable */ }
                }
            }, 0)
        };
        if (reason && this.isLockingAttempt && typeof this.params.onRefused === 'function') {
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
        if (d.screen && d.screen.removeEventListener) {
            d.screen.removeEventListener('click', d.onTap);
            d.screen.removeEventListener('keydown', d.onKey);
        }
    }

    /** True while this copier is the minigame on screen (the UI's own check). */
    _isLive() {
        if (this.ui && typeof this.ui.isLive === 'function') return this.ui.isLive();
        return this.gameState?.isActive !== false;
    }

    /**
     * Ask the server whether this one card opens an access-list lock (UX slice 3b), and
     * follow its answer. The request is unlock-system.js requestRfidAccessUnlock, which waits
     * for a copy still being recorded; the server decides from its own record of the
     * player's cards (a copy it has not seen, a revoked card, a UID-only copy at a lock that
     * wants full authentication are all refused there). On a yes the answer is kept in
     * gameResult.serverResponse, so the door opens from it with no second unlock request.
     * One request at a time: a second press while one is out does nothing.
     */
    _askAccessList(cardId, { cardName, emulated, protocol, isUIDOnly, back, deniedTitle, deniedDetail }) {
        if (this._accessPending) return;
        this._accessPending = true;
        // A tap leaves the door list on screen: show it is being checked (R1 m7)
        if (!emulated && this.ui && typeof this.ui.showAccessChecking === 'function') this.ui.showAccessChecking(cardName);
        const emit = (fields) => {
            if (!emulated || !window.eventDispatcher) return;
            window.eventDispatcher.emit('card_emulated', {
                cardName, cardId, protocol: protocol || 'EM4100', uidOnly: !!isUIDOnly,
                timestamp: Date.now(), ...fields
            });
        };
        Promise.resolve()
            .then(() => this.params.requestAccess([String(cardId)]))
            .catch(() => ({ outcome: 'error', response: null }))
            .then((answer) => {
                this._accessPending = false;
                const outcome = answer && answer.outcome;
                const response = answer && answer.response;
                // Open before this request (R2 m2): the toast names no card, the copier says so
                const alreadyOpen = !!(response && response.alreadyOpen === true);
                const result = { success: true, cardName: alreadyOpen ? null : (cardName || null), emulated, serverResponse: response };
                if (alreadyOpen) result.alreadyOpen = true;
                // A yes has already opened the lock on the server, so the world must follow
                // even when the copier was closed (or replaced) before it could say so
                const late = () => {
                    if (typeof this.params.onLateAccessUnlock !== 'function') return;
                    try { this.params.onLateAccessUnlock(result); } catch (e) { console.warn('onLateAccessUnlock failed:', e); }
                };
                if (!this._isLive()) {
                    if (outcome === 'unlocked') late();
                    return;
                }
                if (outcome === 'unlocked') {
                    if (window.playUISound) window.playUISound('card_scan');
                    if (emulated) this.animations.showEmulationSuccess();
                    else this.animations.showTapSuccess();
                    this.ui.showSuccess(alreadyOpen ? 'Already open' : 'Access Granted');
                    this.gameResult = result;
                    emit({ success: true });
                    setTimeout(() => {
                        if (this._isLive()) this.complete(true);
                        else late();
                    }, emulated ? 2000 : 1500);
                    return;
                }
                if (outcome === 'error') {
                    // No answer is not a refusal: nothing reported to the door
                    this._showDenial('No answer from the reader', back, null,
                        'The card could not be checked. Try again.', 'notice');
                    return;
                }
                if (window.playUISound) window.playUISound('reject');
                if (emulated) this.animations.showEmulationFailure();
                else this.animations.showTapFailure();
                if (outcome === 'uid_only') {
                    emit({ success: false, readerRejectsUIDOnly: true });
                    this._showDenial('Reader requires full authentication', back, 'uid_only',
                        'Only the UID was copied. This reader checks the card\'s encryption keys too.');
                    return;
                }
                emit({ success: false });
                this._showDenial(deniedTitle, back, 'wrong_card', deniedDetail);
            });
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
                `The clone of ${savedCard.name || 'that card'} no longer works. The card has been deactivated.`);
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

        // At an access list the server decides for this one copy (q97: one at a time)
        if (this.accessList) {
            this._askAccessList(cardId, {
                cardName: savedCard.name || null,
                emulated: true,
                protocol,
                isUIDOnly,
                back: () => this.ui.showSavedCards(),
                deniedTitle: 'Card not accepted',
                deniedDetail: `The clone works, but this reader doesn't take ${savedCard.name || 'that card'}.`
            });
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
        const cardId = cardData && cardData.card_id;
        if (!cardId) return undefined;
        // The body's source: a chat clone's NPC; otherwise the card's own id as object_id;
        // otherwise a held inventory card with no id. A world card with no id cannot occur in
        // a game created since the id stamping (5.1); if one does, nothing is sent (5.2).
        let body;
        if (this.cloneSource && this.cloneSource.npc_id) {
            body = { npc_id: this.cloneSource.npc_id };
        } else if (cardData && cardData.id) {
            body = { object_id: cardData.id };
        } else if (this.cloneFrom === 'inventory') {
            body = { held_card: true };
        } else {
            console.warn('💾 Clone source has no id; the copy is not recorded and lasts this session only');
            return undefined;
        }
        const apiClient = window.ApiClient || window.APIClient;
        if (!apiClient || typeof apiClient.cloneCard !== 'function') return undefined;
        // The display card the server stores for the list (SYNC_DELTAS_PLAN P1): identity
        // comes from the server's definition, only rfid_data is read from this.
        const savedCard = this.dataManager?.savedCardForServer?.(cardData) || null;
        const record = Promise.resolve()
            .then(() => apiClient.cloneCard(body, cardId, savedCard))
            .then(answer => {
                console.log('💾 Card copy recorded on server:', answer && answer.recorded, 'saved:', answer && answer.saved);
                return answer;
            })
            .catch(error => {
                console.warn('💾 Could not record card copy on server:', error && error.message);
                return null;
            });
        // syncConfirmed() waits for tracked requests, so an access-list unlock sees the copy (2.2).
        window.stateSync?.track?.(record);
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
            // Handing back to the chat: the framework keeps the pending return, and the NPC
            // stays in chat until the restart (R3 m3)
            this._returnsToChat = true;
            window.pendingConversationReturn.returning = true;
            setTimeout(() => {
                window.returnToConversationAfterRFID();
            }, 100);
        }

        // Call parent complete
        super.complete(success, this.gameResult);
    }

    cleanup() {
        this._endDenial();

        // The copier's own timers (the emulation hold) and resize listener
        if (this.ui && typeof this.ui.cleanup === 'function') this.ui.cleanup();

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

        // Keep the pending return until the chat has restarted, so the NPC (npc-needs
        // inChatWith) never sees a gap (the same pattern as the NPC inventory, R3 m3)
        console.log('Restoring conversation:', conversationState);

        // Restart the appropriate conversation minigame
        if (!window.MinigameFramework) {
            window.pendingConversationReturn = null;
        } else if (!conversationState.resuming) {
            conversationState.resuming = true;
            // Small delay to ensure RFID minigame is fully closed
            setTimeout(() => {
                try {
                    if (conversationState.type === 'person-chat' || conversationState.type === 'phone-chat') {
                        window.MinigameFramework.startMinigame(conversationState.type, null, {
                            npcId: conversationState.npcId,
                            fromTag: true  // Flag to indicate resuming from tag action
                        });
                    }
                } catch (err) {
                    console.warn('Could not resume the chat with', conversationState.npcId, 'after the card reader:', err);
                } finally {
                    if (window.pendingConversationReturn === conversationState) window.pendingConversationReturn = null;
                }
            }, 50);
        }
    } else {
        console.log('No pending conversation return found');
    }
}
