import { MinigameScene } from '../framework/base-minigame.js';

export class CombinationMinigame extends MinigameScene {
    constructor(container, params = {}) {
        super(container, {
            ...params,
            title:      'Combination Padlock',
            showCancel: true,
            cancelText: 'Cancel',
        });

        // Configuration
        this.combination = params.combination || [0, 0, 0];  // [L, R, L]

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

        // Check if this is the expected dial
        if (dialIndex !== this.directionIndex) {
            this._setStatus('Wrong dial. Return to current dial.', 'wrong');
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

        // Check if this dial has reached its target value
        const targetValue = this.combination[dialIndex];
        if (this.dials[dialIndex] === targetValue) {
            // Move to next dial
            if (dialIndex < 2) {
                this.directionIndex++;
                this._updateDirectionIndicator();
                this._setStatus(`Dial ${dialIndex + 1} locked. Moving to Dial ${dialIndex + 2}.`, '');
            } else {
                // All 3 dials set - enable submit
                this._setStatus('All dials locked. Press UNLOCK to submit.', 'success');
                const unlockBtn = this.gameContainer.querySelector('#comb-unlock-btn');
                unlockBtn.disabled = false;
                unlockBtn.classList.add('ready');
            }
        } else {
            // Still working on this dial
            const remaining = Math.abs(targetValue - this.dials[dialIndex]);
            this._setStatus(`Dial ${dialIndex + 1}: ${remaining} more turn${remaining > 1 ? 's' : ''} needed.`, '');
        }
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

        const success = await this._validateWithServer();

        if (success) {
            this._handleSuccess();
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
            if (error?.status) {
                return false;
            }
            console.error('Server validation error:', error);
            this._setStatus('Network error. Try again.', 'wrong');
            return false;
        }
    }

    // ── Success / Failure ────────────────────────────────────────────────────

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
