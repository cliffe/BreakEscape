import { MinigameScene } from '../framework/base-minigame.js';
import { notifyServerUnlock } from '../../systems/unlock-system.js';
import { resolveDualAuthText, escapeHtml } from './dual-auth-text.js';

export class DualAuthMinigame extends MinigameScene {
    constructor(container, params = {}) {
        super(container, {
            ...params,
            title: 'Dual Authorisation Panel',
            showCancel: true,
            cancelText: 'Close'
        });

        const _dualMd = params.lockable?.scenarioData?.minigameData || {};
        this.text = resolveDualAuthText(_dualMd, params);
        this.itsecPin    = String(_dualMd.itsec_pin    || '');
        this.clinicalPin = String(_dualMd.clinical_pin || '');

        this.remainingSec      = 300;
        this.itsecConfirmed    = false;
        this.clinicalConfirmed = false;
        this.finished          = false;
        this.itsecInput        = '';
        this.clinicalInput     = '';
        this._timerId          = null;
    }

    init() {
        super.init();
        // Hide the base framework header — we render our own
        if (this.headerElement) {
            this.headerElement.style.display = 'none';
        }
        this.container.classList.add('da-minigame-container');
        this.gameContainer.classList.add('da-minigame-game-container');
        this.renderLayout();
    }

    start() {
        super.start();
        this._startCountdown();
    }

    renderLayout() {
        this.gameContainer.innerHTML = `
<div class="da-panel-wrap">
  <div class="da-header">
    <div class="da-title">${escapeHtml(this.text.heading)}</div>
    <div class="da-timer" id="da-timer">05:00</div>
  </div>

  <div class="da-panels">
    <div class="da-panel" id="da-panel-itsec">
      <div class="da-panel-header">
        <div class="da-panel-label">${escapeHtml(this.text.itsec_label)}</div>
        <div class="da-panel-name">${escapeHtml(this.text.itsec_name)}</div>
      </div>
      <div class="da-display" id="da-display-itsec">_ _ _ _</div>
      <div class="da-keypad" id="da-keypad-itsec"></div>
      <div class="da-status pending" id="da-status-itsec">PENDING</div>
    </div>

    <div class="da-panel" id="da-panel-clinical">
      <div class="da-panel-header">
        <div class="da-panel-label">${escapeHtml(this.text.clinical_label)}</div>
        <div class="da-panel-name">${escapeHtml(this.text.clinical_name)}</div>
      </div>
      <div class="da-display" id="da-display-clinical">_ _ _ _</div>
      <div class="da-keypad" id="da-keypad-clinical"></div>
      <div class="da-status pending" id="da-status-clinical">PENDING</div>
    </div>
  </div>

  <div class="da-status-bar">
    <div class="da-status-text">AWAITING DUAL AUTHORISATION</div>
    <div class="da-status-indicators">
      <div class="da-indicator" id="da-ind-itsec">${escapeHtml(this.text.itsec_indicator)}</div>
      <div class="da-indicator" id="da-ind-clinical">${escapeHtml(this.text.clinical_indicator)}</div>
    </div>
  </div>

  <div class="da-authorise-wrap">
    <button class="da-authorise-btn" id="da-authorise" disabled>
      ${escapeHtml(this.text.authorise_label)}
    </button>
  </div>
</div>`;

        this._buildKeypad('itsec');
        this._buildKeypad('clinical');

        this.addEventListener(
            this.gameContainer.querySelector('#da-authorise'),
            'click',
            () => this.handleAuthorise()
        );
    }

    _buildKeypad(side) {
        const container = this.gameContainer.querySelector(`#da-keypad-${side}`);
        if (!container) return;

        // 1-2-3 / 4-5-6 / 7-8-9 / CLR-0-ENTER
        const keys = ['1','2','3','4','5','6','7','8','9','CLR','0','ENTER'];
        keys.forEach(k => {
            const btn = document.createElement('button');
            btn.className = k === 'ENTER' ? 'da-key da-key-enter' :
                            k === 'CLR'   ? 'da-key da-key-clear'  :
                            'da-key';
            btn.textContent = k;
            btn.dataset.side = side;
            btn.dataset.key  = k;

            this.addEventListener(btn, 'click', () => {
                if (k === 'CLR')   this.handleClear(side);
                else if (k === 'ENTER') this.handleSubmit(side);
                else this.handleDigit(side, k);
            });

            container.appendChild(btn);
        });
    }

    _updateDisplay(side) {
        const input = side === 'itsec' ? this.itsecInput : this.clinicalInput;
        const display = this.gameContainer.querySelector(`#da-display-${side}`);
        if (!display) return;
        // Show ● for entered digits, _ for remaining slots (always 4 visible)
        const slots = Math.max(4, input.length);
        const chars = [];
        for (let i = 0; i < slots; i++) {
            chars.push(i < input.length ? '●' : '_');
        }
        display.textContent = chars.join(' ');
    }

    handleDigit(side, digit) {
        if (this.finished) return;
        if (side === 'itsec') {
            if (this.itsecConfirmed) return;
            if (this.itsecInput.length >= 6) return;
            this.itsecInput += digit;
        } else {
            if (this.clinicalConfirmed) return;
            if (this.clinicalInput.length >= 6) return;
            this.clinicalInput += digit;
        }
        this._updateDisplay(side);
    }

    handleClear(side) {
        if (this.finished) return;
        if (side === 'itsec') {
            if (this.itsecConfirmed) return;
            this.itsecInput = '';
        } else {
            if (this.clinicalConfirmed) return;
            this.clinicalInput = '';
        }
        this._updateDisplay(side);
    }

    handleSubmit(side) {
        if (this.finished) return;

        const input   = side === 'itsec' ? this.itsecInput   : this.clinicalInput;
        const correct = side === 'itsec' ? this.itsecPin      : this.clinicalPin;
        const display = this.gameContainer.querySelector(`#da-display-${side}`);
        const panel   = this.gameContainer.querySelector(`#da-panel-${side}`);
        const status  = this.gameContainer.querySelector(`#da-status-${side}`);

        if (input !== correct) {
            // Flash denied
            if (display) {
                display.textContent = 'ACCESS DENIED';
                display.classList.add('da-display-denied');
            }
            if (panel)  panel.classList.add('da-panel-denied');
            if (status) {
                status.textContent = 'ACCESS DENIED';
                status.className = 'da-status denied';
            }
            setTimeout(() => {
                if (side === 'itsec') this.itsecInput = '';
                else this.clinicalInput = '';
                this._updateDisplay(side);
                if (display) display.classList.remove('da-display-denied');
                if (panel)   panel.classList.remove('da-panel-denied');
                if (status && !this.itsecConfirmed && side === 'itsec') {
                    status.textContent = 'PENDING';
                    status.className = 'da-status pending';
                }
                if (status && !this.clinicalConfirmed && side === 'clinical') {
                    status.textContent = 'PENDING';
                    status.className = 'da-status pending';
                }
            }, 1500);
            return;
        }

        // Correct PIN
        if (side === 'itsec') {
            this.itsecConfirmed = true;
            this.setGlobalAndNotify('itsec_authorised', true);
        } else {
            this.clinicalConfirmed = true;
            this.setGlobalAndNotify('clinical_eng_authorised', true);
        }

        // Update panel appearance
        if (panel)   panel.classList.add('da-panel-authorised');
        if (display) {
            display.textContent = 'AUTHORISED';
            display.classList.add('da-display-authorised');
        }
        if (status) {
            status.textContent = 'AUTHORISED';
            status.className = 'da-status authorised';
        }

        // Light up the status bar indicator
        const indId = side === 'itsec' ? '#da-ind-itsec' : '#da-ind-clinical';
        const ind = this.gameContainer.querySelector(indId);
        if (ind) ind.classList.add('lit');

        // Update status bar text
        const statusText = this.gameContainer.querySelector('.da-status-text');
        if (statusText) {
            if (this.itsecConfirmed && this.clinicalConfirmed) {
                statusText.textContent = 'BOTH AUTHORISATIONS CONFIRMED';
            } else {
                statusText.textContent = 'AWAITING SECOND AUTHORISATION';
            }
        }

        // Disable all buttons on this panel
        const buttons = this.gameContainer.querySelectorAll(`#da-keypad-${side} button`);
        buttons.forEach(b => { b.disabled = true; });

        this._checkBothConfirmed();
    }

    _checkBothConfirmed() {
        if (this.itsecConfirmed && this.clinicalConfirmed) {
            const btn = this.gameContainer.querySelector('#da-authorise');
            if (btn) btn.disabled = false;
        }
    }

    async handleAuthorise() {
        if (this.finished) return;
        this.finished = true;
        this._stopCountdown();

        this.setGlobalAndNotify('network_isolation_authorised', true);
        this.setGlobalAndNotify('network_isolated', true);

        try {
            const serverResponse = await notifyServerUnlock(
                this.params.lockable, this.params.type || 'object', 'dual_auth'
            );
            this.complete(true, { serverResponse });
        } catch (e) {
            console.error('DualAuth: server unlock notification failed', e);
            this.complete(true, {});
        }
    }

    _startCountdown() {
        const timerEl = () => this.gameContainer.querySelector('#da-timer');

        this._timerId = setInterval(() => {
            if (this.finished) {
                this._stopCountdown();
                return;
            }
            this.remainingSec--;

            const el = timerEl();
            if (el) {
                const m = Math.floor(this.remainingSec / 60);
                const s = this.remainingSec % 60;
                el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
                el.classList.remove('warning', 'critical');
                if (this.remainingSec < 10)      el.classList.add('critical');
                else if (this.remainingSec < 60) el.classList.add('warning');
            }

            if (this.remainingSec <= 0) {
                this._stopCountdown();
                this._onTimeout();
            }
        }, 1000);
    }

    _stopCountdown() {
        if (this._timerId !== null) {
            clearInterval(this._timerId);
            this._timerId = null;
        }
    }

    _onTimeout() {
        if (this.finished) return;
        this.finished = true;
        this.setGlobalAndNotify('dual_auth_failed', true);

        const wrap = this.gameContainer.querySelector('.da-panel-wrap');
        if (wrap) {
            const banner = document.createElement('div');
            banner.className = 'da-result-banner failure show';
            banner.textContent = 'AUTHORISATION TIMED OUT — SESSION EXPIRED';
            wrap.insertBefore(banner, wrap.firstChild);
        }

        setTimeout(() => this.complete(false), 1500);
    }

    setGlobalAndNotify(name, value) {
        if (window.npcManager?.setGlobalVariable) {
            window.npcManager.setGlobalVariable(name, value);
            return;
        }
        const oldValue = window.gameState?.globalVariables?.[name];
        if (window.gameState?.globalVariables) {
            window.gameState.globalVariables[name] = value;
        }
        window.npcConversationStateManager?.broadcastGlobalVariableChange(name, value, null);
        window.eventDispatcher?.emit(`global_variable_changed:${name}`, { name, value, oldValue });
    }

    cleanup() {
        this._stopCountdown();
        super.cleanup();
    }
}
