import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { ASSETS_PATH, ASSETS_VERSION } from '../../config.js';
import { escapeHtml } from '../../utils/escape-html.js';

const ICON_BASE = `${ASSETS_PATH}/icons`;

// Scenario text is plain text: escape it once before it goes into HTML

const TIMER_DURATION_MS = 72 * 60 * 60 * 1000;

// A scenario's `timerRate` is story minutes per real minute (sis01: 84, the rate of its ICO
// HUD timer, 63 h over 45 minutes of play). A positive number, else 1 (real time).
export function ransomTimerRate(minigameData) {
    const rate = Number(minigameData?.timerRate);
    return Number.isFinite(rate) && rate > 0 ? Math.min(rate, 1440) : 1;
}

// Real ms that a story window of `hours` lasts at `rate`
export function ransomRealDurationMs(hours, rate) {
    return (hours * 60 * 60 * 1000) / rate;
}

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
    // Draws in the shared console window (UI decision X8): the window title is neutral (the
    // params title); the red ransom notice is the screen's own content and stays inside it
    static consoleWindow = true;
    static consoleWindowFill = true;

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

    // Milliseconds since the start the HUD timers count from: the timer dispatcher's start
    // (ScenarioTimerUI follows it), then the game clock as the fallback. Opening the note must
    // not start its own clock.
    storyElapsedMs() {
        const start = window.scenarioTimerDispatcher?.startTime;
        if (Number.isFinite(start)) return Math.max(0, Date.now() - start);
        return window.gameClock.elapsedMs();
    }

    ensureDeadlineTimestamp() {
        // At a story rate with a game clock, the countdown is derived from the HUD timers'
        // start (storyElapsedMs) on every tick. Nothing is read from or written
        // to the saved `ransomware_deadline_at` on this path, so a reload cannot drift the note
        // and an old 1:1 saved deadline is ignored.
        const clockRate = ransomTimerRate(this.params.lockable?.scenarioData?.minigameData);
        if (clockRate > 1 && typeof window.gameClock?.elapsedMs === 'function') {
            const hours = Number(this.params.lockable?.scenarioData?.minigameData?.timerHours);
            this.timerRate = clockRate;
            this.clockHours = Number.isFinite(hours) && hours > 0 ? hours : TIMER_DURATION_MS / 3600000;
            this.deadlineAt = null;
            return;
        }
        this.clockHours = null;
        const vars = window.gameState?.globalVariables || {};
        const existingDeadline = parseTimestamp(vars.ransomware_deadline_at);

        if (existingDeadline) {
            this.timerRate = ransomTimerRate(this.params.lockable?.scenarioData?.minigameData);
            this.deadlineAt = existingDeadline;
            return;
        }

        // A scenario's `timerHours` sets the clock (m02's note says twelve hours of
        // backup power); without it the display keeps its original 72 hours.
        const timerHours = Number(this.params.lockable?.scenarioData?.minigameData?.timerHours);
        // `timerRate` (opt-in) runs the countdown at the story rate the HUD clock uses, so the
        // note and the HUD agree; the saved deadline stays a real timestamp.
        this.timerRate = ransomTimerRate(this.params.lockable?.scenarioData?.minigameData);
        const durationMs = ransomRealDurationMs(
            Number.isFinite(timerHours) && timerHours > 0 ? timerHours : TIMER_DURATION_MS / 3600000,
            this.timerRate);
        const scenarioStart = this.getScenarioStartTimestamp();
        const deadlineAt = scenarioStart + durationMs;
        if (window.gameState?.globalVariables) {
            window.gameState.globalVariables['ransomware_deadline_at'] = deadlineAt;
        }
        this.deadlineAt = deadlineAt;
    }

    updateTimerDisplay() {
        const timerEl = this.gameContainer.querySelector('#ransomware-timer-value');
        if (!timerEl || (!this.deadlineAt && !this.clockHours)) {
            return;
        }

        const remainingMs = this.clockHours
            ? this.clockHours * 3600000 - this.storyElapsedMs() * this.timerRate
            : (this.deadlineAt - Date.now()) * (this.timerRate || 1);
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

        const organisation   = escapeHtml(displayDashes(scenarioData.organisation   || 'ORGANISATION'));
        const encryptedSystems = escapeHtml(displayDashes(scenarioData.encryptedSystems || 'systems encrypted'));
        const ransomAmount   = escapeHtml(displayDashes(scenarioData.ransomAmount   || 'AMOUNT'));
        const ransomBitcoin  = escapeHtml(scenarioData.ransomBitcoin  || '');
        const walletAddress  = escapeHtml(scenarioData.walletAddress  || '');
        const groupName      = scenarioData.groupName      || 'Ransomware Group';
        const supportPortal  = escapeHtml(scenarioData.supportPortal  || '');
        // Optional per-terminal lines (host name, what this machine was doing, a
        // targeted threat), so each infected screen can say something of its own.
        const extraLines = escapeHtml(displayDashes(Array.isArray(scenarioData.extraLines)
            ? scenarioData.extraLines.join('\n')
            : (scenarioData.extraLines || '')));

        this.gameContainer.innerHTML = `
            <div class="ransomware-display-bg">
                <div class="ransomware-display-panel">
                    <div class="ransomware-display-icon">
                        <img class="ransomware-display-icon-img" src="${ICON_BASE}/ransom_skull.png?v=${ASSETS_VERSION}" alt="Skull and crossbones" width="72" height="72">
                        <span class="ransomware-display-icon-sep" aria-hidden="true">//</span>
                        <img class="ransomware-display-icon-img" src="${ICON_BASE}/ransom_padlock.png?v=${ASSETS_VERSION}" alt="Padlock" width="72" height="72">
                    </div>
                    <h2 class="ransomware-display-title">YOUR FILES HAVE BEEN ENCRYPTED</h2>
                    <pre class="ransomware-display-body pixel-scroll">${organisation}
${encryptedSystems}
${ransomBitcoin ? `${ransomBitcoin} - ${ransomAmount}` : ransomAmount}
${walletAddress ? `Wallet: ${walletAddress}` : ''}
DO NOT attempt recovery - encrypted files will be destroyed${supportPortal ? `\nSupport: ${supportPortal}` : ''}</pre>
                    ${extraLines ? `<pre class="ransomware-display-body ransomware-display-extra pixel-scroll">${extraLines}</pre>` : ''}

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
