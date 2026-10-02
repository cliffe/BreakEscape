import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { ASSETS_PATH, ASSETS_VERSION } from '../../config.js';

const ICON_BASE = `${ASSETS_PATH}/icons`;

const TIMER_DURATION_MS = 72 * 60 * 60 * 1000;

function parseTimestamp(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const asNumber = Number(value);
        if (Number.isFinite(asNumber)) {
            return asNumber;
        }

        const asDate = Date.parse(value);
        if (Number.isFinite(asDate)) {
            return asDate;
        }
    }

    return null;
}

function formatCountdown(remainingMs) {
    const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

export class RansomwareDisplayMinigame extends MinigameScene {
    constructor(container, params) {
        params = params || {};
        params.title = params.title || 'Ransomware Impact Display';
        params.showCancel = true;
        params.cancelText = params.cancelText || 'Close';

        super(container, params);

        this.timerInterval = null;
        this.deadlineAt = null;
    }

    init() {
        super.init();

        this.container.className += ' ransomware-display-minigame-container';
        this.gameContainer.className += ' ransomware-display-game-container';
        this.headerElement.style.display = 'none';

        this.render();

        // Resolve and persist timer state during init so re-opens are consistent.
        this.ensureDeadlineTimestamp();
        this.updateTimerDisplay();
    }

    start() {
        super.start();

        if (this.isRansomwareDeployed()) {
            this.timerInterval = setInterval(() => {
                this.updateTimerDisplay();
            }, 1000);
        }
    }

    isRansomwareDeployed() {
        return !!window.gameState?.globalVariables?.ransomware_deployed;
    }

    getScenarioStartTimestamp() {
        const vars = window.gameState?.globalVariables || {};
        const fromGlobals = parseTimestamp(vars.scenario_start_time) || parseTimestamp(vars.scenarioStartTime);
        const fromState = parseTimestamp(window.gameState?.startTime);

        return fromGlobals || fromState || Date.now();
    }

    ensureDeadlineTimestamp() {
        const vars = window.gameState?.globalVariables || {};
        const existingDeadline = parseTimestamp(vars.ransomware_deadline_at);

        if (existingDeadline) {
            this.deadlineAt = existingDeadline;
            return;
        }

        // A scenario's `timerHours` sets the clock (m02's note says twelve hours of
        // backup power); without it the display keeps its original 72 hours.
        const timerHours = Number(this.params.lockable?.scenarioData?.minigameData?.timerHours);
        const durationMs = Number.isFinite(timerHours) && timerHours > 0
            ? timerHours * 60 * 60 * 1000
            : TIMER_DURATION_MS;
        const scenarioStart = this.getScenarioStartTimestamp();
        const deadlineAt = scenarioStart + durationMs;
        if (window.gameState?.globalVariables) {
            window.gameState.globalVariables['ransomware_deadline_at'] = deadlineAt;
        }
        this.deadlineAt = deadlineAt;
    }

    updateTimerDisplay() {
        const timerEl = this.gameContainer.querySelector('#ransomware-timer-value');
        if (!timerEl || !this.deadlineAt) {
            return;
        }

        const remainingMs = this.deadlineAt - Date.now();
        const expired = remainingMs <= 0;

        timerEl.textContent = formatCountdown(remainingMs);
        timerEl.classList.toggle('expired', expired);

        const timerLabelEl = this.gameContainer.querySelector('#ransomware-timer-label');
        if (timerLabelEl) {
            timerLabelEl.textContent = expired ? 'TIME EXPIRED:' : 'TIME REMAINING:';
        }
    }

    render() {
        const deployed = this.isRansomwareDeployed();
        const scenarioData = this.params.lockable?.scenarioData?.minigameData || {};

        const organisation   = displayDashes(scenarioData.organisation   || 'ORGANISATION');
        const encryptedSystems = displayDashes(scenarioData.encryptedSystems || 'systems encrypted');
        const ransomAmount   = displayDashes(scenarioData.ransomAmount   || 'AMOUNT');
        const ransomBitcoin  = scenarioData.ransomBitcoin  || '';
        const walletAddress  = scenarioData.walletAddress  || '';
        const groupName      = scenarioData.groupName      || 'Ransomware Group';
        const supportPortal  = scenarioData.supportPortal  || '';
        // Optional per-terminal lines (host name, what this machine was doing, a
        // targeted threat), so each infected screen can say something of its own.
        const extraLines = displayDashes(Array.isArray(scenarioData.extraLines)
            ? scenarioData.extraLines.join('\n')
            : (scenarioData.extraLines || ''));

        this.gameContainer.innerHTML = `
            <div class="ransomware-display-bg">
                <div class="ransomware-display-panel">
                    <div class="ransomware-display-icon">
                        <img class="ransomware-display-icon-img" src="${ICON_BASE}/ransom_skull.png?v=${ASSETS_VERSION}" alt="Skull and crossbones" width="72" height="72">
                        <span class="ransomware-display-icon-sep" aria-hidden="true">//</span>
                        <img class="ransomware-display-icon-img" src="${ICON_BASE}/ransom_padlock.png?v=${ASSETS_VERSION}" alt="Padlock" width="72" height="72">
                    </div>
                    <h2 class="ransomware-display-title">YOUR FILES HAVE BEEN ENCRYPTED</h2>
                    <pre class="ransomware-display-body">${organisation}
${encryptedSystems}
${ransomBitcoin ? `${ransomBitcoin} - ${ransomAmount}` : ransomAmount}
${walletAddress ? `Wallet: ${walletAddress}` : ''}
DO NOT attempt recovery - encrypted files will be destroyed${supportPortal ? `\nSupport: ${supportPortal}` : ''}</pre>
                    ${extraLines ? `<pre class="ransomware-display-body ransomware-display-extra">${extraLines}</pre>` : ''}

                    <div class="ransomware-display-timer-row">
                        <span id="ransomware-timer-label">TIME REMAINING:</span>
                        <span id="ransomware-timer-value">${deployed ? '...' : 'N/A'}</span>
                    </div>

                    ${!deployed ? '<div class="ransomware-display-note warning">Ransomware event is not currently deployed in global state.</div>' : ''}
                </div>
            </div>
        `;
    }

    cleanup() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        super.cleanup();
    }
}
