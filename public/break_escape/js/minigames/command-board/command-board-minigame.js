import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

import {
    DEFAULT_TITLE,
    DEFAULT_SUBTITLE,
    DEFAULT_PRESEED,
    CommandBoardRecorder,
    buildEntries,
    sortEntries,
    computeStatusRows
} from './command-board-timeline.js';
import { currentClockText } from '../../systems/game-clock.js';

const STATE_KEY = 'mg12_command_board_state';

// Wall-clock stamp, used only when there is no game clock (tests, old pages)
function formatWallTimestamp(date = new Date()) {
    const day = date.toLocaleDateString('en-GB', { weekday: 'short' });
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${hh}:${mm}`;
}

function isCriticalType(type) {
    return String(type || '').toLowerCase() === 'critical';
}

export class CommandBoardMinigame extends MinigameScene {
    constructor(container, params = {}) {
        const mergedParams = {
            ...params,
            title: params.title || 'Major Incident Command Board',
            showCancel: false,
            disableClose: false
        };

        super(container, mergedParams);

        // Scenario config on the command_board object (scenarioData.commandBoard);
        // without one the board shows its built-in (sis01) entries and status rows
        const scenarioData = params.lockable?.scenarioData || {};
        this.boardConfig = (scenarioData.commandBoard && typeof scenarioData.commandBoard === 'object')
            ? scenarioData.commandBoard : {};

        this.entries = [];
        this.manualEntryCount = 0;
        this._eventSubs = [];
        this._clockInterval = null;
        this._headerPulseTimeout = null;
        this.statusStateCache = new Map();

        this.timelineListEl = null;
        this.statusListEl = null;
        this.manualInputEl = null;
        this.manualPostEl = null;
        this.clockEl = null;
        this.dotContainerEl = null;
        this.headerEl = null;
    }

    init() {
        super.init();

        this.container.classList.add('command-board-container');
        this.gameContainer.classList.add('command-board-game-container');

        if (this.headerElement) {
            this.headerElement.style.display = 'none';
        }

        this.restoreState();
        this.renderLayout();
        this.renderTimeline();
        this.renderStatusPanel(false);
        this.updateHeaderClock();
        this.updateStatusDots();
    }

    start() {
        super.start();

        this.bindUiEvents();
        this.subscribeScenarioEvents();
        this.evaluateAndAppendAllEvents();
        this.renderStatusPanel(false);
        this.updateStatusDots();

        // Every few seconds, so an in-game clock keeps pace with game time
        this._clockInterval = setInterval(() => {
            this.updateHeaderClock();
        }, 5000);
    }

    complete(success) {
        this.persistState();
        if (window.MinigameFramework) {
            window.MinigameFramework.endMinigame(false, {
                aborted: true,
                minigameName: 'command-board'
            });
            return;
        }
        super.complete(false);
    }

    cleanup() {
        if (this._clockInterval) {
            clearInterval(this._clockInterval);
            this._clockInterval = null;
        }

        if (this._headerPulseTimeout) {
            clearTimeout(this._headerPulseTimeout);
            this._headerPulseTimeout = null;
        }

        this.unsubscribeScenarioEvents();
        super.cleanup();
    }

    bindUiEvents() {
        if (this.manualInputEl) {
            this.addEventListener(this.manualInputEl, 'input', () => {
                this.updateManualPostState();
            });

            this.addEventListener(this.manualInputEl, 'keydown', (event) => {
                if (event.key === 'Enter' && !this.manualPostEl?.disabled) {
                    event.preventDefault();
                    this.handleManualPost();
                }
            });
        }

        if (this.manualPostEl) {
            this.addEventListener(this.manualPostEl, 'click', () => this.handleManualPost());
        }

        this.updateManualPostState();
    }

    subscribeScenarioEvents() {
        if (!window.eventDispatcher) return;

        // Any global can matter (scenario timelines watch their own), so listen to all;
        // the game clock, attached earlier, has already logged the change
        const eventName = 'global_variable_changed:*';
        const handler = () => {
            this.evaluateAndAppendAllEvents();
            this.renderStatusPanel(true);
            this.updateStatusDots();
        };
        window.eventDispatcher.on(eventName, handler);
        this._eventSubs.push({ event: eventName, handler });
    }

    unsubscribeScenarioEvents() {
        if (!window.eventDispatcher || !this._eventSubs.length) return;

        this._eventSubs.forEach((sub) => window.eventDispatcher.off(sub.event, sub.handler));
        this._eventSubs = [];
    }

    getGlobals() {
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.globalVariables) window.gameState.globalVariables = {};
        // Read-only: this used to rewrite backup_recovery_source ("nas_encrypted" -> "NAS")
        // and set ico_notified, which broke ink and credits conditions on those values
        return window.gameState.globalVariables;
    }

    _stamp(atMs) {
        const clock = window.gameClock;
        return clock?.formatStamp ? clock.formatStamp(atMs) : formatWallTimestamp(new Date());
    }

    /**
     * The recorder that has been stamping entries since game start (core/game.js). A
     * page without one (a test harness) gets a local one, stamped when the board opens.
     */
    recorder() {
        if (window.commandBoardRecorder) return window.commandBoardRecorder;
        if (!this._localRecorder) {
            const clock = window.gameClock;
            this._localRecorder = new CommandBoardRecorder({
                config: this.boardConfig,
                initialGlobals: window.gameScenario?.globalVariables || {},
                now: () => (clock?.elapsedMs ? clock.elapsedMs() : 0)
            });
        }
        return this._localRecorder;
    }

    /**
     * Rebuild the entries from the recorder: each auto entry carries the game time it
     * happened, and they sort by time (D8, D10). Pulse the header for a new critical one.
     */
    evaluateAndAppendAllEvents() {
        const globals = this.getGlobals();
        const recorder = this.recorder();
        recorder.reconcile(globals);   // anything set without an event

        const manual = this.entries.filter(e => e.source === 'manual');
        const before = new Set(this.entries.map(e => e.eventKey));
        this.entries = buildEntries(manual, recorder.entries(globals), (t) => this._stamp(t), this.preseedEntries());
        const added = this.entries.filter(e => !before.has(e.eventKey));

        this.renderTimeline(added.map(e => e.eventKey));
        this.persistState();

        if (before.size > 0 && added.some(e => isCriticalType(e.type))) {
            this.pulseHeaderCritical();
        }
    }

    preseedEntries() {
        return Array.isArray(this.boardConfig.preseed) ? this.boardConfig.preseed : DEFAULT_PRESEED;
    }

    appendManualEntry(text) {
        const clock = window.gameClock;
        const atMs = clock?.elapsedMs ? clock.elapsedMs() : Date.now();
        this.entries.unshift({
            timestamp: this._stamp(atMs),
            text,
            type: 'decision',
            source: 'manual',
            eventKey: `manual:${Date.now()}:${Math.random().toString(16).slice(2, 8)}`,
            atMs
        });
        this.entries = sortEntries(this.entries);

        this.manualEntryCount += 1;
        this.renderTimeline([this.entries[0]?.eventKey]);
        this.persistState();
    }

    hasEventKey(eventKey) {
        return this.entries.some((entry) => entry.eventKey === eventKey);
    }

    handleManualPost() {
        const text = String(this.manualInputEl?.value || '').trim();
        if (!text) {
            return;
        }

        this.appendManualEntry(text);

        if (this.manualInputEl) {
            this.manualInputEl.value = '';
        }

        this.updateManualPostState();
    }

    updateManualPostState() {
        if (!this.manualPostEl || !this.manualInputEl) return;
        this.manualPostEl.disabled = String(this.manualInputEl.value || '').trim().length === 0;
    }

    renderLayout() {
        this.gameContainer.innerHTML = `
            <div class="cb-panel" id="cb-panel">
                <div class="cb-header" id="cb-header">
                    <div class="cb-header-title-wrap">
                        <div class="cb-header-title"></div>
                        <div class="cb-header-subtitle"></div>
                    </div>
                    <div class="cb-header-right">
                        <div class="cb-status-dots" id="cb-status-dots">
                            <span class="cb-status-dot dot-1"></span>
                            <span class="cb-status-dot dot-2"></span>
                            <span class="cb-status-dot dot-3"></span>
                        </div>
                        <div class="cb-clock" id="cb-clock">00:00</div>
                    </div>
                </div>
                <div class="cb-body">
                    <section class="cb-timeline-col">
                        <div class="cb-section-title">INCIDENT TIMELINE</div>
                        <div class="cb-section-subtitle">auto-updating - global state driven</div>
                        <div class="cb-timeline-list" id="cb-timeline-list"></div>
                    </section>
                    <section class="cb-status-col">
                        <div class="cb-section-title">SYSTEM STATUS</div>
                        <div class="cb-status-list" id="cb-status-list"></div>
                    </section>
                </div>
                <div class="cb-entry-bar">
                    <input id="cb-manual-input" class="cb-entry-input" type="text" maxlength="200" placeholder="LOG DECISION OR ACTION" />
                    <button id="cb-manual-post" class="cb-post-btn" type="button">POST</button>
                </div>
            </div>
        `;

        this.timelineListEl = this.gameContainer.querySelector('#cb-timeline-list');
        this.statusListEl = this.gameContainer.querySelector('#cb-status-list');
        this.manualInputEl = this.gameContainer.querySelector('#cb-manual-input');
        this.manualPostEl = this.gameContainer.querySelector('#cb-manual-post');
        this.clockEl = this.gameContainer.querySelector('#cb-clock');
        this.dotContainerEl = this.gameContainer.querySelector('#cb-status-dots');
        this.headerEl = this.gameContainer.querySelector('#cb-header');

        const titleEl = this.gameContainer.querySelector('.cb-header-title');
        const subtitleEl = this.gameContainer.querySelector('.cb-header-subtitle');
        if (titleEl) titleEl.textContent = displayDashes(String(this.boardConfig.title || DEFAULT_TITLE));
        if (subtitleEl) subtitleEl.textContent = displayDashes(String(this.boardConfig.subtitle || DEFAULT_SUBTITLE));
    }

    renderTimeline(newKeys = []) {
        if (!this.timelineListEl) return;
        const fresh = new Set(newKeys);

        this.timelineListEl.innerHTML = '';

        this.entries.forEach((entry, index) => {
            const tile = document.createElement('article');
            tile.className = `cb-entry-tile ${fresh.has(entry.eventKey) ? 'slide-in' : ''}`;

            const typeClass = `type-${String(entry.type || 'response').toLowerCase()}`;
            if (isCriticalType(entry.type)) {
                tile.classList.add('critical-entry');
            }

            const leftBar = document.createElement('span');
            leftBar.className = `cb-entry-left-bar ${typeClass}`;

            const main = document.createElement('div');
            main.className = 'cb-entry-main';

            const timestamp = document.createElement('span');
            timestamp.className = 'cb-entry-timestamp';
            timestamp.textContent = String(entry.timestamp || '');

            const text = document.createElement('span');
            text.className = 'cb-entry-text';
            text.textContent = displayDashes(String(entry.text || ''));

            main.appendChild(timestamp);
            main.appendChild(text);

            tile.appendChild(leftBar);
            tile.appendChild(main);

            const badge = this.renderEntryBadge(entry.source);
            if (badge) {
                const badgeEl = document.createElement('span');
                badgeEl.className = `cb-entry-badge ${badge.className}`;
                badgeEl.textContent = badge.label;
                tile.appendChild(badgeEl);
            }

            this.timelineListEl.appendChild(tile);
        });
    }

    renderEntryBadge(source) {
        if (source === 'auto') return { className: 'auto', label: '[AUTO]' };
        if (source === 'manual') return { className: 'manual', label: '[MANUAL]' };
        return null;
    }

    renderStatusPanel(animateChanges) {
        if (!this.statusListEl) return;

        const rows = computeStatusRows(this.boardConfig, this.getGlobals());

        this.statusListEl.innerHTML = '';

        rows.forEach((rowConfig) => {
            const rowStatus = rowConfig.status;
            const row = document.createElement('div');
            row.className = 'cb-status-row';

            const labelEl = document.createElement('span');
            labelEl.className = 'cb-status-label';
            labelEl.textContent = rowConfig.label;
            const badge = document.createElement('span');
            badge.className = `cb-status-badge state-${rowStatus.key.toLowerCase()}`;
            badge.textContent = rowStatus.label;
            row.appendChild(labelEl);
            row.appendChild(badge);

            const oldKey = this.statusStateCache.get(rowConfig.label);
            if (animateChanges && oldKey && oldKey !== rowStatus.key) {
                badge.classList.add('flash');
            }

            this.statusStateCache.set(rowConfig.label, rowStatus.key);
            this.statusListEl.appendChild(row);
        });
    }

    updateHeaderClock() {
        if (!this.clockEl) return;
        // In-game time when the scenario sets one (scenario.gameClock), else the wall clock
        this.clockEl.textContent = currentClockText(false);
    }

    updateStatusDots() {
        if (!this.dotContainerEl) return;

        const globals = this.getGlobals();
        const dots = Array.from(this.dotContainerEl.querySelectorAll('.cb-status-dot'));
        dots.forEach((dot) => dot.classList.remove('green', 'amber', 'red', 'blink'));

        if (globals.ico_notified === true) {
            dots.forEach((dot) => dot.classList.add('green'));
            return;
        }

        if (dots[0]) {
            dots[0].classList.add('red', 'blink');
        }
        if (dots[1]) {
            dots[1].classList.add('amber');
        }
        if (dots[2]) {
            dots[2].classList.add('amber');
        }
    }

    pulseHeaderCritical() {
        if (!this.headerEl) return;

        this.headerEl.classList.remove('cb-critical-pulse');
        void this.headerEl.offsetWidth;
        this.headerEl.classList.add('cb-critical-pulse');

        if (this._headerPulseTimeout) {
            clearTimeout(this._headerPulseTimeout);
        }

        this._headerPulseTimeout = setTimeout(() => {
            this.headerEl?.classList.remove('cb-critical-pulse');
        }, 1700);
    }

    persistState() {
        // Only the player's own entries: auto entries live in the recorder, saved as
        // { id, t } (commandBoardLog), and the preseed comes from the config
        const globals = this.getGlobals();
        globals[STATE_KEY] = {
            entries: this.entries.filter(e => e.source === 'manual'),
            manualEntryCount: this.manualEntryCount
        };
    }

    restoreState() {
        const globals = this.getGlobals();
        const persisted = globals[STATE_KEY];

        // Manual entries come from here; an older save's auto entries (wall-clock stamps)
        // are dropped, since the recorder has them (reconciled at load)
        const manual = Array.isArray(persisted?.entries) ? persisted.entries.filter(e => e?.source === 'manual') : [];
        this.manualEntryCount = Number(persisted?.manualEntryCount || 0);
        this.entries = buildEntries(manual, this.recorder().entries(globals), (t) => this._stamp(t), this.preseedEntries());
    }
}
