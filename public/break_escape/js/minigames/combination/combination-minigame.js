import { MinigameScene } from '../framework/base-minigame.js';
import { LOCK_SCOPE_REFUSAL_TEXT, lockScopeRefusal } from '../../utils/lock-scope-refusal.js';

export class CombinationMinigame extends MinigameScene {
    constructor(container, params = {}) {
        super(container, {
            ...params,
            title:      'Combination Padlock',
            showCancel: true,
            cancelText: 'Cancel',
        });

        // The combination itself never reaches the client: the server checks the
        // dials against the lock's `requires` (unlock gaps build, 2026-11-12).

        // Game state
        this.dials = [0, 0, 0];           // Current position of each dial
        this.activeDial = 0;              // The dial the arrows turn now (0 to 2)
        this.attemptCount = 0;
        this.maxAttempts = 3;
        this.isLocked = false;
        this.isSubmitting = false;
        this.serverResponse = null;
        this._holdTimer = null;
        this._holdFired = false;
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';
        this.container.classList.add('combination-minigame-container');
        this.gameContainer.classList.add('combination-game-container');
        this._renderLayout();
    }

    start() {
        super.start();
        this._refreshDials();
        this._setStatus('Set dial 1 first. Turning dial 2 then locks dial 1 in.', '');
    }

    cleanup() {
        this._stopHold();
        super.cleanup();
    }

    // ── Layout ───────────────────────────────────────────────────────────────

    _renderLayout() {
        this.gameContainer.innerHTML = `
<div class="combination-wrapper">
  <div class="combination-header">
    <h2>Combination Padlock</h2>
    <div class="combination-direction-indicator" id="comb-direction"></div>
    <div class="combination-help">◀ ▶ turn the glowing dial one number (hold to spin). Turning the next dial sets the one before.</div>
  </div>

  <div class="combination-dials" id="comb-dials"></div>

  <div class="combination-status">
    <div class="combination-status-message" id="comb-status"></div>
  </div>

  <div class="combination-footer">
    <button class="combination-reset-btn" id="comb-reset-btn">Reset</button>
    <button class="combination-unlock-btn" id="comb-unlock-btn" disabled>Unlock</button>
  </div>
</div>`;

        const dialsContainer = this.gameContainer.querySelector('#comb-dials');
        for (let i = 0; i < 3; i++) {
            const dialGroup = document.createElement('div');
            dialGroup.className = 'combination-dial-group';
            dialGroup.id = `comb-dial-${i}`;

            const label = document.createElement('div');
            label.className = 'combination-dial-label';
            label.id = `comb-label-${i}`;
            label.textContent = `Dial ${i + 1}`;
            dialGroup.appendChild(label);

            const row = document.createElement('div');
            row.className = 'combination-dial-row';

            const leftBtn = document.createElement('button');
            leftBtn.className = 'combination-dial-arrow';
            leftBtn.textContent = '◀';
            leftBtn.title = 'Down one (hold to spin)';
            leftBtn.dataset.dial = i;
            leftBtn.dataset.direction = 'left';
            this._bindArrow(leftBtn, i, 'left');
            row.appendChild(leftBtn);

            const display = document.createElement('div');
            display.className = 'combination-dial-display';
            display.id = `comb-display-${i}`;
            display.textContent = '00';
            row.appendChild(display);

            const rightBtn = document.createElement('button');
            rightBtn.className = 'combination-dial-arrow';
            rightBtn.textContent = '▶';
            rightBtn.title = 'Up one (hold to spin)';
            rightBtn.dataset.dial = i;
            rightBtn.dataset.direction = 'right';
            this._bindArrow(rightBtn, i, 'right');
            row.appendChild(rightBtn);

            dialGroup.appendChild(row);
            dialsContainer.appendChild(dialGroup);
        }

        const resetBtn = this.gameContainer.querySelector('#comb-reset-btn');
        this.addEventListener(resetBtn, 'click', () => this._handleReset());

        const unlockBtn = this.gameContainer.querySelector('#comb-unlock-btn');
        this.addEventListener(unlockBtn, 'click', () => this._handleUnlock());
    }

    // A click turns one number. Holding the button spins: after a short pause it
    // repeats, and speeds up, until released. The click that ends a hold is ignored.
    _bindArrow(btn, dialIndex, direction) {
        this.addEventListener(btn, 'click', () => {
            if (this._holdFired) { this._holdFired = false; return; }
            this._rotateDial(dialIndex, direction);
        });
        // A hold released off the button gives no click, so the flag could stay set and
        // swallow the next Enter or Space; a key press is never the end of a hold (R2 n4)
        this.addEventListener(btn, 'keydown', () => { this._holdFired = false; });
        this.addEventListener(btn, 'pointerdown', () => {
            this._stopHold();
            this._holdFired = false;
            let repeats = 0;
            const tick = () => {
                // The current dial spins, and so does the next one: its first turn sets
                // the current dial and moves on, as a click does (R2 m3). Any other dial
                // does nothing more.
                if (dialIndex !== this.activeDial && dialIndex !== this.activeDial + 1) { this._stopHold(); return; }
                this._holdFired = true;
                // At spin speed the click sounds on every third turn only (R2 n5)
                const quiet = repeats > 8 && repeats % 3 !== 0;
                this._rotateDial(dialIndex, direction, { quiet });
                repeats++;
                this._holdTimer = setTimeout(tick, repeats > 8 ? 45 : 110);
            };
            this._holdTimer = setTimeout(tick, 380);
        });
        for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) {
            this.addEventListener(btn, ev, () => this._stopHold());
        }
    }

    _stopHold() {
        if (this._holdTimer) clearTimeout(this._holdTimer);
        this._holdTimer = null;
    }

    // ── Dial rotation ────────────────────────────────────────────────────────

    // Either arrow turns the current dial, so an overshoot is one click back.
    // Turning the next dial sets the current one (it turns green and locks) and
    // moves the new dial one number, so that first click always shows.
    _rotateDial(dialIndex, direction, { quiet = false } = {}) {
        if (this.isLocked || this.isSubmitting) return;

        if (dialIndex < this.activeDial) {
            this._setStatus(`Dial ${dialIndex + 1} is set at ${this._pad(this.dials[dialIndex])}. Press Reset to change it.`, 'wrong');
            return;
        }
        if (dialIndex > this.activeDial + 1) {
            this._setStatus(`Set dial ${this.activeDial + 1} first, then dial ${this.activeDial + 2}.`, 'wrong');
            return;
        }

        let justSet = null;
        if (dialIndex === this.activeDial + 1) {
            justSet = this.activeDial;
            this.activeDial = dialIndex;
        }

        if (window.playUISound && !quiet) window.playUISound('keypad');
        const step = direction === 'left' ? -1 : 1;
        this.dials[dialIndex] = (this.dials[dialIndex] + step + 40) % 40;
        this._refreshDials();

        const now = this._pad(this.dials[dialIndex]);
        if (dialIndex < 2) {
            const lead = justSet !== null ? `Dial ${justSet + 1} set at ${this._pad(this.dials[justSet])}. ` : '';
            this._setStatus(`${lead}Dial ${dialIndex + 1} at ${now}. When it is right, turn dial ${dialIndex + 2} to set it.`, justSet !== null ? 'set' : '');
        } else {
            const lead = justSet !== null ? `Dial 2 set at ${this._pad(this.dials[1])}. ` : '';
            this._setStatus(`${lead}Dial 3 at ${now}. Press UNLOCK to try ${this._combo()}.`, 'success');
            this._enableUnlock();
        }
    }

    _pad(n) { return String(n).padStart(2, '0'); }

    _combo() { return this.dials.map(n => this._pad(n)).join('-'); }

    _enableUnlock() {
        const unlockBtn = this.gameContainer.querySelector('#comb-unlock-btn');
        unlockBtn.disabled = false;
        unlockBtn.classList.add('ready');
    }

    _disableUnlock() {
        const unlockBtn = this.gameContainer.querySelector('#comb-unlock-btn');
        unlockBtn.disabled = true;
        unlockBtn.classList.remove('ready');
    }

    // ── Display updates ──────────────────────────────────────────────────────

    // Every dial shows its number; the current one glows, set ones are green
    // (only while they are being entered, never as a hint after a wrong try).
    _refreshDials(opened = false) {
        for (let i = 0; i < 3; i++) this._updateDialDisplay(i, opened);
        this._updateDirectionIndicator(opened);
    }

    _updateDialDisplay(dialIndex, opened = false) {
        const display = this.gameContainer.querySelector(`#comb-display-${dialIndex}`);
        if (display) {
            display.textContent = this._pad(this.dials[dialIndex]);
            const isSet = opened || this.activeDial > dialIndex;
            display.classList.toggle?.('set', isSet);
            display.classList.toggle?.('active', !opened && this.activeDial === dialIndex);
        }
        const group = this.gameContainer.querySelector(`#comb-dial-${dialIndex}`);
        if (group) {
            group.classList.toggle?.('active', !opened && this.activeDial === dialIndex);
            group.classList.toggle?.('set', opened || this.activeDial > dialIndex);
        }
        const label = this.gameContainer.querySelector(`#comb-label-${dialIndex}`);
        if (label) {
            let state = '';
            if (opened || this.activeDial > dialIndex) state = ' · SET';
            else if (this.activeDial === dialIndex) state = ' · TURN';
            label.textContent = `Dial ${dialIndex + 1}${state}`;
        }
    }

    _updateDirectionIndicator(opened = false) {
        const indicator = this.gameContainer.querySelector('#comb-direction');
        if (!indicator) return;
        if (opened) { indicator.textContent = 'Open'; return; }
        indicator.textContent = this.activeDial < 2
            ? `Set dial ${this.activeDial + 1} of 3`
            : 'Set dial 3, then Unlock';
    }

    _setStatus(message, cssClass = '') {
        const statusEl = this.gameContainer.querySelector('#comb-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = 'combination-status-message';
            if (cssClass) statusEl.classList.add(cssClass);
        }
    }

    // ── Reset ────────────────────────────────────────────────────────────────

    // Puts the dials back to 00 and says so. A caller with its own reason passes
    // the message, which is shown after the reset, never wiped by it.
    _handleReset(message = 'Dials back at 00. Set dial 1 first.', cssClass = '') {
        if (this.isLocked || this.isSubmitting) return;

        this._stopHold();
        this.dials = [0, 0, 0];
        this.activeDial = 0;
        this._refreshDials();
        this._disableUnlock();
        this._setStatus(message, cssClass);
    }

    // ── Unlock ───────────────────────────────────────────────────────────────

    async _handleUnlock() {
        if (this.isLocked || this.isSubmitting) return;

        this.isSubmitting = true;
        const unlockBtn = this.gameContainer.querySelector('#comb-unlock-btn');
        unlockBtn.disabled = true;

        this.scopeRefusal = null;
        this.networkError = false;
        const success = await this._validateWithServer();

        if (success) {
            this._handleSuccess();
        } else if (this.scopeRefusal) {
            this._handleScopeRefusal(this.scopeRefusal);
        } else if (this.networkError) {
            this._handleNetworkError();
        } else {
            this._handleFailure();
        }

        this.isSubmitting = false;
    }

    // The request never completed (R2 m4): not a wrong try. The dials stay as set, no
    // attempt is counted and UNLOCK can send the same numbers again.
    _handleNetworkError() {
        this._setStatus(`Network error: ${this._combo()} was not checked. Press UNLOCK to try again.`, 'wrong');
        if (this.activeDial >= 2) this._enableUnlock();
    }

    async _validateWithServer() {
        try {
            const lockable = this.params.lockable || this.params.sprite;
            const targetType = this.params.type || 'object';

            let targetId;
            if (targetType === 'door') {
                targetId = lockable.doorProperties?.connectedRoom || lockable.doorProperties?.roomId;
            } else {
                targetId = lockable.scenarioData?.id || lockable.scenarioData?.name || lockable.objectId;
            }

            if (!targetId) {
                console.error('Could not determine targetId for combination validation');
                return false;
            }

            const combinationStr = this.dials.join('-');
            console.log('Validating combination with server:', { targetType, targetId, combination: combinationStr });

            const apiClient = window.ApiClient || window.APIClient;
            const response = await apiClient.unlock(targetType, targetId, combinationStr, 'combination');

            if (response.success && response.hasContents && response.contents && lockable.scenarioData) {
                lockable.scenarioData.contents = response.contents;
            }

            this.serverResponse = response;
            return response.success;
        } catch (error) {
            // A status means the server answered and said no -- that is a wrong
            // combination, not a network problem. Only a request that never
            // completed deserves the network message.
            // The server refused the PC the lock sits on (off, not responding or out of
            // reach), not the answer (review R4 m2): no attempt, and never "wrong"
            const refusal = lockScopeRefusal(error);
            if (refusal) {
                this.scopeRefusal = refusal;
                return false;
            }
            // A 5xx is a server fault, not a wrong answer (code review R3 n3): it takes the
            // network path, so no attempt is counted and the entry stays sendable
            if (error?.status && error.status < 500) {
                return false;
            }
            console.error('Server validation error:', error);
            this.networkError = true;
            return false;
        }
    }

    // ── Success / Failure ────────────────────────────────────────────────────

    // Says why and closes as cancelled, counting no attempt (as the PIN pad does)
    _handleScopeRefusal(reason) {
        this.isLocked = true;
        this._setStatus(LOCK_SCOPE_REFUSAL_TEXT[reason], '');
        this.gameResult = { success: false, cancelled: true, refused: reason, attempts: this.attemptCount };
        setTimeout(() => this.complete(false), 2000);
    }

    _handleSuccess() {
        this.isLocked = true;
        this._stopHold();
        this._refreshDials(true);
        this.gameContainer.querySelector('.combination-wrapper')?.classList.add('opened');
        const unlockBtn = this.gameContainer.querySelector('#comb-unlock-btn');
        if (unlockBtn) { unlockBtn.textContent = 'Open'; unlockBtn.disabled = true; }
        this._setStatus('✓ Combination Correct! The shackle springs open.', 'success');

        if (window.playUISound) window.playUISound('confirm');

        this.gameResult = {
            success: true,
            combination: this.dials,
            attempts: this.attemptCount,
            timeToComplete: Date.now() - this.startTime,
            serverResponse: this.serverResponse
        };

        setTimeout(() => this.complete(true), 1500);
    }

    _handleFailure() {
        this.attemptCount++;

        if (this.attemptCount >= this.maxAttempts) {
            this.isLocked = true;
            this._setStatus('✗ Maximum attempts reached. System locked.', 'wrong');
            if (window.playUISound) window.playUISound('reject');

            this.gameResult = {
                success: false,
                attempts: this.attemptCount,
                maxAttemptsReached: true
            };

            setTimeout(() => this.complete(false), 2000);
        } else {
            const remaining = this.maxAttempts - this.attemptCount;
            const tried = this._combo();
            if (window.playUISound) window.playUISound('reject');

            // The lock only says the whole combination is wrong, so no dial stays
            // green. The dials go back to 00 and the message says how to retry.
            this.isSubmitting = false;
            this._handleReset();
            this._setStatus(`✗ ${tried} did not open it. ${remaining} attempt${remaining > 1 ? 's' : ''} left. Dials back at 00: set dial 1 again.`, 'wrong');
        }
    }
}
