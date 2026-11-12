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
        this.directionIndex = 0;          // Expected direction (0=L, 1=R, 2=L)
        this.directionSequence = ['left', 'right', 'left'];
        this.attemptCount = 0;
        this.maxAttempts = 3;
        this.isLocked = false;
        this.isSubmitting = false;
        this.serverResponse = null;
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
        this._updateDirectionIndicator();
    }

    cleanup() {
        super.cleanup();
    }

    // ── Layout ───────────────────────────────────────────────────────────────

    _renderLayout() {
        this.gameContainer.innerHTML = `
<div class="combination-wrapper">
  <div class="combination-header">
    <h2>Combination Padlock</h2>
    <div class="combination-direction-indicator" id="comb-direction"></div>
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

        // Build dials
        const dialsContainer = this.gameContainer.querySelector('#comb-dials');
        for (let i = 0; i < 3; i++) {
            const dialGroup = document.createElement('div');
            dialGroup.className = 'combination-dial-group';
            dialGroup.id = `comb-dial-${i}`;

            const label = document.createElement('div');
            label.className = 'combination-dial-label';
            label.textContent = `Position ${i + 1}`;
            dialGroup.appendChild(label);

            const row = document.createElement('div');
            row.className = 'combination-dial-row';

            // Left arrow
            const leftBtn = document.createElement('button');
            leftBtn.className = 'combination-dial-arrow';
            leftBtn.textContent = '◀';
            leftBtn.dataset.dial = i;
            leftBtn.dataset.direction = 'left';
            this.addEventListener(leftBtn, 'click', () => this._rotateDial(i, 'left'));
            row.appendChild(leftBtn);

            // Display
            const display = document.createElement('div');
            display.className = 'combination-dial-display';
            display.id = `comb-display-${i}`;
            display.textContent = '00';
            row.appendChild(display);

            // Right arrow
            const rightBtn = document.createElement('button');
            rightBtn.className = 'combination-dial-arrow';
            rightBtn.textContent = '▶';
            rightBtn.dataset.dial = i;
            rightBtn.dataset.direction = 'right';
            this.addEventListener(rightBtn, 'click', () => this._rotateDial(i, 'right'));
            row.appendChild(rightBtn);

            dialGroup.appendChild(row);
            dialsContainer.appendChild(dialGroup);
        }

        // Buttons
        const resetBtn = this.gameContainer.querySelector('#comb-reset-btn');
        this.addEventListener(resetBtn, 'click', () => this._handleReset());

        const unlockBtn = this.gameContainer.querySelector('#comb-unlock-btn');
        this.addEventListener(unlockBtn, 'click', () => this._handleUnlock());
    }

    // ── Dial rotation ────────────────────────────────────────────────────────

    _rotateDial(dialIndex, direction) {
        if (this.isLocked || this.isSubmitting) return;

        // Turning the next dial the way it goes sets the current one and moves on,
        // as on a real padlock, where a change of direction sets the last number.
        if (dialIndex === this.directionIndex + 1 && dialIndex <= 2 &&
            direction === this.directionSequence[dialIndex]) {
            this.directionIndex = dialIndex;
            this._updateDialDisplay(dialIndex - 1);
            this._updateDirectionIndicator();
            this._setStatus(`Dial ${dialIndex} set at ${this.dials[dialIndex - 1]}. Turn dial ${dialIndex + 1} ${direction.toUpperCase()}.`, '');
            // On the last dial any number, 0 included, can be tried
            if (dialIndex === 2) this._enableUnlock();
            return;
        }

        // Check if this is the expected dial
        if (dialIndex !== this.directionIndex) {
            this._setStatus(dialIndex < this.directionIndex
                ? `Dial ${dialIndex + 1} is set. Press Reset to start again.`
                : 'Wrong dial. Return to current dial.', 'wrong');
            return;
        }

        const expectedDirection = this.directionSequence[this.directionIndex];
        if (direction !== expectedDirection) {
            this._setStatus(`Wrong direction on dial ${dialIndex + 1}. Turn ${expectedDirection.toUpperCase()}.`, 'wrong');
            this._handleReset();
            return;
        }

        // Play sound
        if (window.playUISound) window.playUISound('keypad');

        // Rotate dial
        const step = direction === 'left' ? -1 : 1;
        this.dials[dialIndex] = (this.dials[dialIndex] + step + 40) % 40;

        // Update display
        this._updateDialDisplay(dialIndex);

        if (dialIndex < 2) {
            const next = this.directionSequence[dialIndex + 1].toUpperCase();
            this._setStatus(`Dial ${dialIndex + 1} at ${this.dials[dialIndex]}. Turn dial ${dialIndex + 2} ${next} to set it.`, '');
        } else {
            this._setStatus(`Dial 3 at ${this.dials[2]}. Press UNLOCK to try the combination.`, 'success');
            this._enableUnlock();
        }
    }

    _enableUnlock() {
        const unlockBtn = this.gameContainer.querySelector('#comb-unlock-btn');
        unlockBtn.disabled = false;
        unlockBtn.classList.add('ready');
    }

    // ── Display updates ──────────────────────────────────────────────────────

    _updateDialDisplay(dialIndex) {
        const display = this.gameContainer.querySelector(`#comb-display-${dialIndex}`);
        if (display) {
            display.textContent = String(this.dials[dialIndex]).padStart(2, '0');
            if (this.directionIndex > dialIndex) {
                display.classList.add('set');
            }
        }
    }

    _updateDirectionIndicator() {
        const indicator = this.gameContainer.querySelector('#comb-direction');
        if (!indicator) return;

        const directions = ['Turn LEFT ↙', 'Turn RIGHT ↗', 'Turn LEFT ↙'];
        indicator.textContent = directions[this.directionIndex];
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

    _handleReset() {
        if (this.isLocked || this.isSubmitting) return;

        this.dials = [0, 0, 0];
        this.directionIndex = 0;

        for (let i = 0; i < 3; i++) {
            this._updateDialDisplay(i);
        }

        const unlockBtn = this.gameContainer.querySelector('#comb-unlock-btn');
        unlockBtn.disabled = true;
        unlockBtn.classList.remove('ready');

        this._setStatus('');
        this._updateDirectionIndicator();
    }

    // ── Unlock ───────────────────────────────────────────────────────────────

    async _handleUnlock() {
        if (this.isLocked || this.isSubmitting) return;

        this.isSubmitting = true;
        const unlockBtn = this.gameContainer.querySelector('#comb-unlock-btn');
        unlockBtn.disabled = true;

        this.scopeRefusal = null;
        const success = await this._validateWithServer();

        if (success) {
            this._handleSuccess();
        } else if (this.scopeRefusal) {
            this._handleScopeRefusal(this.scopeRefusal);
        } else {
            this._handleFailure();
        }

        this.isSubmitting = false;
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
            if (error?.status) {
                return false;
            }
            console.error('Server validation error:', error);
            this._setStatus('Network error. Try again.', 'wrong');
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
        this._setStatus('✓ Combination Correct! Access Granted.', 'success');

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
            this._setStatus(`✗ Incorrect combination. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`, 'wrong');
            if (window.playUISound) window.playUISound('reject');

            this._handleReset();
        }
    }
}
