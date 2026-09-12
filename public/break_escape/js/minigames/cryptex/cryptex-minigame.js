import { MinigameScene } from '../framework/base-minigame.js';

export class CryptexMinigame extends MinigameScene {
    constructor(container, params = {}) {
        super(container, {
            ...params,
            title:      'Cryptex Password',
            showCancel: true,
            cancelText: 'Cancel',
        });

        // Configuration
        this.cryptexConfig = params.cryptexConfig || {};
        this.wheelCount = this.cryptexConfig.wheelCount || 5;

        // Set up alphabets (default to uppercase A-Z)
        this.alphabets = this.cryptexConfig.alphabets ||
            Array(this.wheelCount).fill('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

        // Game state
        this.currentIndices = Array(this.wheelCount).fill(0);  // Current position of each wheel
        this.answerIndices = [];  // Target indices (parsed from answer string)
        this.attemptCount = 0;
        this.maxAttempts = this.cryptexConfig.maxAttempts || 3;
        this.isLocked = false;
        this.isSubmitting = false;
        this.serverResponse = null;

        // Optional features
        this.hintStrip = this.cryptexConfig.hintStrip || {};
        this.wornRings = this.cryptexConfig.wornRings || {};

        // Parse answer string to indices
        this._parseAnswer();
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';
        this.container.classList.add('cryptex-minigame-container');
        this.gameContainer.classList.add('cryptex-game-container');
        this._renderLayout();
    }

    start() {
        super.start();
    }

    cleanup() {
        super.cleanup();
    }

    // ── Answer parsing ─────────────────────────────────────────────────────

    _parseAnswer() {
        const answerStr = this.cryptexConfig.answer || '';
        this.answerIndices = [];

        for (let i = 0; i < Math.min(answerStr.length, this.wheelCount); i++) {
            const char = answerStr[i];
            const alphabet = this.alphabets[i] || '';
            const index = alphabet.indexOf(char);

            if (index === -1) {
                console.warn(`Char '${char}' not found in wheel ${i} alphabet`);
                this.answerIndices.push(0);  // Fallback to position 0
            } else {
                this.answerIndices.push(index);
            }
        }
    }

    // ── Layout ───────────────────────────────────────────────────────────────

    _renderLayout() {
        this.gameContainer.innerHTML = `
<div class="cryptex-wrapper">
  <div class="cryptex-header">
    <h2>Cryptex Password</h2>
    <p>Turn wheels to spell the word</p>
  </div>

  <div class="cryptex-wheels" id="cryptex-wheels"></div>

  ${this.hintStrip.enabled ? `
    <div class="cryptex-hint-strip" id="cryptex-hint-strip"></div>
  ` : ''}

  <div class="cryptex-status">
    <div class="cryptex-status-message" id="cryptex-status"></div>
  </div>

  <div class="cryptex-footer">
    <button class="cryptex-reset-btn" id="cryptex-reset-btn">Reset</button>
    <button class="cryptex-submit-btn" id="cryptex-submit-btn" disabled>Submit</button>
  </div>
</div>`;

        // Build wheels
        const wheelsContainer = this.gameContainer.querySelector('#cryptex-wheels');
        for (let i = 0; i < this.wheelCount; i++) {
            const wheelGroup = document.createElement('div');
            wheelGroup.className = 'cryptex-wheel-group';
            wheelGroup.id = `cryptex-wheel-${i}`;

            const label = document.createElement('div');
            label.className = 'cryptex-wheel-label';
            label.textContent = `Pos ${i + 1}`;
            wheelGroup.appendChild(label);

            const row = document.createElement('div');
            row.className = 'cryptex-wheel-row';

            // Up arrow
            const upBtn = document.createElement('button');
            upBtn.className = 'cryptex-wheel-arrow';
            upBtn.textContent = '↑';
            upBtn.dataset.wheel = i;
            upBtn.dataset.direction = 'up';
            this.addEventListener(upBtn, 'click', () => this._rotateWheel(i, -1));
            row.appendChild(upBtn);

            // Display
            const display = document.createElement('div');
            display.className = 'cryptex-wheel-display';
            display.id = `cryptex-display-${i}`;
            display.textContent = this.alphabets[i][0];
            row.appendChild(display);

            // Down arrow
            const downBtn = document.createElement('button');
            downBtn.className = 'cryptex-wheel-arrow';
            downBtn.textContent = '↓';
            downBtn.dataset.wheel = i;
            downBtn.dataset.direction = 'down';
            this.addEventListener(downBtn, 'click', () => this._rotateWheel(i, 1));
            row.appendChild(downBtn);

            wheelGroup.appendChild(row);
            wheelsContainer.appendChild(wheelGroup);
        }

        // Build hint strip if enabled
        if (this.hintStrip.enabled) {
            const hintContainer = this.gameContainer.querySelector('#cryptex-hint-strip');
            const clueChars = this.hintStrip.clueChars || [];

            for (let i = 0; i < this.wheelCount; i++) {
                const hintChar = document.createElement('div');
                hintChar.className = 'hint-char';

                const char = clueChars[i] || '_';
                hintChar.textContent = char;

                if (char === '_') {
                    hintChar.classList.add('hidden');
                }

                // Mark as worn if in worn positions
                if (this.wornRings.enabled && this.wornRings.wornPositions) {
                    const wheelWornPositions = this.wornRings.wornPositions[`wheel${i}`] || [];
                    if (wheelWornPositions.length > 0) {
                        hintChar.classList.add('worn');
                    }
                }

                hintContainer.appendChild(hintChar);
            }
        }

        // Buttons
        const resetBtn = this.gameContainer.querySelector('#cryptex-reset-btn');
        this.addEventListener(resetBtn, 'click', () => this._handleReset());

        const submitBtn = this.gameContainer.querySelector('#cryptex-submit-btn');
        this.addEventListener(submitBtn, 'click', () => this._handleSubmit());
    }

    // ── Wheel rotation ──────────────────────────────────────────────────────

    _rotateWheel(wheelIndex, direction) {
        if (this.isLocked || this.isSubmitting) return;

        const alphabet = this.alphabets[wheelIndex];
        const alphabetLength = alphabet.length;

        // Rotate: direction -1 goes backward (up), +1 goes forward (down)
        this.currentIndices[wheelIndex] = (this.currentIndices[wheelIndex] + direction + alphabetLength) % alphabetLength;

        // Update display
        this._updateWheelDisplay(wheelIndex);

        // Play sound
        if (window.playUISound) window.playUISound('keypad');

        // Check if all wheels are complete
        this._checkCompletion();
    }

    // ── Display updates ─────────────────────────────────────────────────────

    _updateWheelDisplay(wheelIndex) {
        const display = this.gameContainer.querySelector(`#cryptex-display-${wheelIndex}`);
        if (display) {
            const alphabet = this.alphabets[wheelIndex];
            const char = alphabet[this.currentIndices[wheelIndex]];
            display.textContent = char;

            // Mark as complete if this wheel matches answer
            if (this.currentIndices[wheelIndex] === this.answerIndices[wheelIndex]) {
                display.classList.add('complete');
            } else {
                display.classList.remove('complete');
            }

            // Mark as worn if this character is in worn positions
            if (this.wornRings.enabled && this.wornRings.wornPositions) {
                const wheelWornPositions = this.wornRings.wornPositions[`wheel${wheelIndex}`] || [];
                if (wheelWornPositions.includes(this.currentIndices[wheelIndex])) {
                    display.classList.add('worn');
                } else {
                    display.classList.remove('worn');
                }
            }
        }
    }

    _checkCompletion() {
        const allComplete = this.currentIndices.every((idx, w) => idx === this.answerIndices[w]);
        const submitBtn = this.gameContainer.querySelector('#cryptex-submit-btn');

        if (allComplete) {
            submitBtn.disabled = false;
            submitBtn.classList.add('ready');
            this._setStatus('All wheels matched! Press SUBMIT.', 'success');
        } else {
            submitBtn.disabled = true;
            submitBtn.classList.remove('ready');
        }
    }

    _setStatus(message, cssClass = '') {
        const statusEl = this.gameContainer.querySelector('#cryptex-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = 'cryptex-status-message';
            if (cssClass) statusEl.classList.add(cssClass);
        }
    }

    // ── Reset ───────────────────────────────────────────────────────────────

    _handleReset() {
        if (this.isLocked || this.isSubmitting) return;

        this.currentIndices = Array(this.wheelCount).fill(0);

        for (let i = 0; i < this.wheelCount; i++) {
            this._updateWheelDisplay(i);
        }

        const submitBtn = this.gameContainer.querySelector('#cryptex-submit-btn');
        submitBtn.disabled = true;
        submitBtn.classList.remove('ready');

        this._setStatus('');
    }

    // ── Submit ──────────────────────────────────────────────────────────────

    async _handleSubmit() {
        if (this.isLocked || this.isSubmitting) return;

        this.isSubmitting = true;
        const submitBtn = this.gameContainer.querySelector('#cryptex-submit-btn');
        submitBtn.disabled = true;

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
                console.error('Could not determine targetId for cryptex validation');
                return false;
            }

            // Build the answer string from current indices
            const answerStr = this.currentIndices
                .map((idx, w) => this.alphabets[w][idx])
                .join('');

            console.log('Validating cryptex with server:', { targetType, targetId, answer: answerStr });

            const apiClient = window.ApiClient || window.APIClient;
            const response = await apiClient.unlock(targetType, targetId, answerStr, 'cryptex');

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
        this._setStatus('✓ Cryptex Unlocked! Access Granted.', 'success');

        if (window.playUISound) window.playUISound('confirm');

        this.gameResult = {
            success: true,
            answer: this.currentIndices.map((idx, w) => this.alphabets[w][idx]).join(''),
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
            this._setStatus(`✗ Incorrect. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`, 'wrong');
            if (window.playUISound) window.playUISound('reject');

            // Keep wheels in place (don't reset)
            const submitBtn = this.gameContainer.querySelector('#cryptex-submit-btn');
            submitBtn.disabled = true;
            submitBtn.classList.remove('ready');
        }
    }
}
