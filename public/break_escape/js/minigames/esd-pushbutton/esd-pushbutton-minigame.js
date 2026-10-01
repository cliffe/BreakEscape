import { MinigameScene } from '../framework/base-minigame.js';
import { applyActions } from '../../systems/apply-actions.js';
import { resolveConditionalText } from '../../utils/conditional-text.js';

/**
 * ESD Pushbutton Minigame
 *
 * Fully scenario-driven. All Albion-specific values come from scenarioData
 * (passed as params via startEsdPushbuttonMinigame).
 *
 * Required params:
 *   label              — panel label text (e.g. "EMERGENCY SHUTDOWN - RACKS A1-A4")
 *   authVar            — global var that must be true before the button is armed
 *   activatedVar       — global var written true on activation (also used to resume state)
 *   completionActions  — actions[] fired on confirm (set_global, complete_task, etc.)
 *
 * Optional params:
 *   confirmDesc        — first line of confirm modal (default: "This action is irreversible.")
 *   unauthorizedText   — status text when authVar is not yet set
 *   unauthorizedTextVariants — [{ condition, text }] state-aware overrides of unauthorizedText;
 *                      first matching condition (globalVars syntax) wins
 *   alreadyActiveText  — status text shown on reopen when already activated
 *   confirmedText      — status text shown immediately after confirming activation
 *   conditionalActions — [{ ifGlobalFalse: 'varName', actions: [] }] for conditional side-effects
 */

export class EsdPushbuttonMinigame extends MinigameScene {
    constructor(container, params) {
        params = params || {};
        const sd = params.lockable?.scenarioData?.minigameData || {};

        super(container, {
            ...params,
            showCancel: true,
            title:      sd.title      || 'Emergency Shutdown Control',
            cancelText: sd.cancelText || 'Cancel',
        });

        this._sd            = sd;
        this.state          = 'ARMED_GUARD_DOWN';
        this.guardElement   = null;
        this.buttonElement  = null;
        this.confirmModal   = null;
        this.confirmButton  = null;
        this.cancelButton   = null;
        this.statusElement  = null;
        this.ledElement     = null;
        this.lockable       = params.lockable || null;
        this.authorizationGranted = false;
        this.alreadyActivated     = false;
    }

    init() {
        super.init();

        this.container.className  += ' esd-pushbutton-minigame-container';
        this.gameContainer.className += ' esd-pushbutton-game-container';
        this.headerElement.style.display = 'none';

        const globals      = window.gameState?.globalVariables || {};
        const authVar      = this._sd.authVar      || 'esd_authorized';
        const activatedVar = this._sd.activatedVar || 'esd_activated';

        this.authorizationGranted = globals[authVar]      === true;
        this.alreadyActivated     = globals[activatedVar] === true;

        this.render();
        this.applyInitialState();
    }

    start() {
        super.start();

        if (this.guardElement) {
            this.addEventListener(this.guardElement,  'click', () => this.handleGuardFlip());
        }
        if (this.buttonElement) {
            this.addEventListener(this.buttonElement, 'click', () => this.handleButtonPress());
        }
        if (this.confirmButton) {
            this.addEventListener(this.confirmButton, 'click', () => this.handleConfirm());
        }
        if (this.cancelButton) {
            this.addEventListener(this.cancelButton,  'click', () => this.hideConfirmModal());
        }
    }

    render() {
        const label       = this._sd.label       || 'EMERGENCY SHUTDOWN';
        const confirmDesc = this._sd.confirmDesc || 'This action is irreversible without manual reset.';

        this.gameContainer.innerHTML = `
            <div class="esd-panel">
                <div class="esd-label">${label}</div>
                <div class="esd-housing">
                    <div class="esd-guard" id="esd-guard" aria-label="Safety Guard"></div>
                    <button class="esd-button" id="esd-button" aria-label="ESD Button" disabled></button>
                    <div class="esd-led" id="esd-led" aria-label="Status LED"></div>
                </div>
                <div class="esd-status" id="esd-status">Flip guard to arm ESD control.</div>
            </div>
            <div class="esd-confirm-modal" id="esd-confirm-modal" aria-hidden="true">
                <div class="esd-confirm-card">
                    <h3>CONFIRM EMERGENCY SHUTDOWN?</h3>
                    <p>${confirmDesc}</p>
                    <div class="esd-confirm-actions">
                        <button class="esd-confirm" id="esd-confirm">CONFIRM - INITIATE SHUTDOWN</button>
                        <button class="esd-cancel" id="esd-cancel">CANCEL</button>
                    </div>
                </div>
            </div>
        `;

        this.guardElement  = this.gameContainer.querySelector('#esd-guard');
        this.buttonElement = this.gameContainer.querySelector('#esd-button');
        this.confirmModal  = this.gameContainer.querySelector('#esd-confirm-modal');
        this.confirmButton = this.gameContainer.querySelector('#esd-confirm');
        this.cancelButton  = this.gameContainer.querySelector('#esd-cancel');
        this.statusElement = this.gameContainer.querySelector('#esd-status');
        this.ledElement    = this.gameContainer.querySelector('#esd-led');
    }

    applyInitialState() {
        const alreadyActiveText = this._sd.alreadyActiveText || 'Emergency shutdown already active.';
        const unauthorizedText  = resolveConditionalText(
            this._sd.unauthorizedText || 'Authorisation required before pressing ESD.',
            (this._sd.unauthorizedTextVariants || []).map(v => ({ condition: v?.condition, value: v?.text })),
            window.gameState?.globalVariables || {}
        );

        if (this.alreadyActivated) {
            this.state = 'ACTIVATED';
            this.guardElement.classList.add('open');
            this.buttonElement.classList.add('pressed');
            this.buttonElement.setAttribute('disabled', 'true');
            this.ledElement.classList.add('active');
            this.statusElement.textContent = alreadyActiveText;
            return;
        }

        if (!this.authorizationGranted) {
            this.statusElement.textContent = unauthorizedText;
            this.guardElement.classList.add('disabled');
            this.buttonElement.setAttribute('disabled', 'true');
        }
    }

    handleGuardFlip() {
        if (!this.authorizationGranted || this.alreadyActivated) return;
        if (this.state === 'CONFIRM_MODAL' || this.state === 'ACTIVATED') return;

        if (this.state === 'ARMED_GUARD_DOWN') {
            this.state = 'GUARD_OPEN';
            this.guardElement.classList.add('open');
            this.buttonElement.removeAttribute('disabled');
            this.statusElement.textContent = 'Guard open. Press button to continue.';
        } else if (this.state === 'GUARD_OPEN') {
            this.state = 'ARMED_GUARD_DOWN';
            this.guardElement.classList.remove('open');
            this.buttonElement.setAttribute('disabled', 'true');
            this.statusElement.textContent = 'Guard closed. Flip guard to arm ESD control.';
        }

        if (window.playUISound) window.playUISound('lock');
    }

    handleButtonPress() {
        if (!this.authorizationGranted || this.alreadyActivated) return;
        if (this.state !== 'GUARD_OPEN') return;

        this.state = 'CONFIRM_MODAL';
        this.confirmModal.classList.add('active');
        this.confirmModal.setAttribute('aria-hidden', 'false');
    }

    hideConfirmModal() {
        this.state = 'GUARD_OPEN';
        this.confirmModal.classList.remove('active');
        this.confirmModal.setAttribute('aria-hidden', 'true');
    }

    handleConfirm() {
        if (!this.authorizationGranted || this.alreadyActivated) return;
        if (this.state !== 'CONFIRM_MODAL') return;

        this.state = 'ACTIVATED';
        this.confirmModal.classList.remove('active');
        this.confirmModal.setAttribute('aria-hidden', 'true');

        this.buttonElement.classList.add('pressed');
        this.buttonElement.setAttribute('disabled', 'true');
        this.guardElement.classList.add('open');
        this.ledElement.classList.add('active');

        const confirmedText = this._sd.confirmedText || 'SHUTDOWN ACTIVE';
        this.statusElement.textContent = confirmedText;

        this.applyEsdOutcome();

        this.gameResult = { esdActivated: true, action: 'esd_confirmed' };

        setTimeout(() => this.complete(true), 300);
    }

    applyEsdOutcome() {
        const globals = window.gameState?.globalVariables || {};

        // Conditional side-effects defined in scenarioData
        const conditionalActions = this._sd.conditionalActions || [];
        for (const entry of conditionalActions) {
            if (entry.ifGlobalFalse && !globals[entry.ifGlobalFalse]) {
                applyActions(entry.actions || [], { source: 'esd_minigame' });
            }
            if (entry.ifGlobalTrue && globals[entry.ifGlobalTrue]) {
                applyActions(entry.actions || [], { source: 'esd_minigame' });
            }
        }

        // Main completion actions
        const completionActions = this._sd.completionActions || [];
        applyActions(completionActions, { source: 'esd_minigame' });

        // Unlock the physical object in the game world
        const objectId = this.lockable?.scenarioData?.id || this.lockable?.objectId || 'esd_pushbutton';

        if (this.lockable?.scenarioData) {
            this.lockable.scenarioData.locked    = false;
            this.lockable.scenarioData.esdState  = 'activated';
        }

        applyActions([{ type: 'unlock_object', objectId }], {
            source: 'esd_minigame',
            gameId: window.breakEscapeConfig?.gameId || window.gameConfig?.gameId
        });

        if (window.gameState) {
            window.gameState.unlockedObjects = window.gameState.unlockedObjects || [];
            if (objectId && !window.gameState.unlockedObjects.includes(objectId)) {
                window.gameState.unlockedObjects.push(objectId);
            }
        }

        if (window.eventDispatcher) {
            window.eventDispatcher.emit('item_unlocked', {
                itemId:   objectId,
                itemType: this.lockable?.scenarioData?.type,
                itemName: this.lockable?.scenarioData?.name,
                lockType: this.lockable?.scenarioData?.lockType || 'esd_button'
            });
        }

        if (window.playUISound) {
            window.playUISound('confirm');
            window.playUISound('success');
        }
    }
}
