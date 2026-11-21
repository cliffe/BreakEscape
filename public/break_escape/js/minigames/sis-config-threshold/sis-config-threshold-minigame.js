import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { escapeHtml } from '../../utils/escape-html.js';

// Scenario text is plain text: escape it once before it goes into HTML

const DEFAULT_ROWS = [
    {
        parameter: 'THERMAL_RUNAWAY_THRESHOLD',
        currentValue: '85C',
        certifiedValue: '55C',
        status: 'AMBER',
        lastModified: '03:22 (today)',
        modifiedBy: 'engineering_access',
        detailText: 'This value deviates from the IEC 61511 certified baseline. Possible causes: (1) authorised maintenance change requiring recertification, (2) unauthorised modification.'
    },
    {
        parameter: 'H2_ALARM_THRESHOLD',
        currentValue: '1.2% LEL',
        certifiedValue: '1.0% LEL',
        status: 'AMBER',
        lastModified: '03:22 (today)',
        modifiedBy: 'engineering_access',
        detailText: 'Hydrogen trip threshold has been raised above certified baseline, reducing early-warning margin.'
    },
    {
        parameter: 'MAX_CHARGE_VOLTAGE',
        currentValue: '4.32 V/cell',
        certifiedValue: '4.25 V/cell',
        status: 'AMBER',
        lastModified: '03:22 (today)',
        modifiedBy: 'engineering_access',
        detailText: 'Overcharge protection limit exceeds certified value, increasing thermal risk during charging.'
    }
];

// Long parameter names (THERMAL_RUNAWAY_THRESHOLD) should wrap at underscores, not mid-word.
function wrapAtUnderscores(text) {
    return String(text ?? '').replace(/_/g, '_<wbr>');
}

function normalizeStatus(status) {
    return String(status || 'GREEN').toUpperCase();
}

// The line under the panel's buttons. Only rows that are not GREEN open a detail, so the line
// never tells the player to select rows when none can be selected (sis02 blind playtest m7)
// The Confirm button waits for the certification record; this line says so in words (the
// grey button is not the only cue) without naming where the record is
export const SIS_CONFIRM_LOCKED_TEXT = 'Certification document needed to confirm tampering';

export function sisHelpText(canCompare, selectableCount) {
    const nothingToSelect = !(selectableCount > 0);
    if (canCompare) {
        return nothingToSelect
            ? 'No row is flagged. Compare with the certification document to check the values.'
            : 'Select a highlighted row for its detail, or compare with the certification document.';
    }
    return nothingToSelect
        ? 'No row is flagged. Retrieve the SIS certification document to unlock side-by-side comparison.'
        : 'Select a highlighted row for its detail. Retrieve the SIS certification document to unlock side-by-side comparison.';
}

export class SisConfigThresholdMinigame extends MinigameScene {
    // Draws in the shared console window (UI decision X8): title bar and X come from there
    static consoleWindow = true;

    consoleTitle() {
        return 'SIS CONFIGURATION - BATTERY HALL SIS';
    }

    constructor(container, params = {}) {
        super(container, params);
        this.rows = Array.isArray(params.rows) && params.rows.length > 0 ? params.rows : DEFAULT_ROWS;
        this.compareTitle = params.compareTitle || 'Certification Comparison';
        this.confirmLabel = params.confirmLabel || 'Confirm SIS Tamper - Report to Security';
    }

    init() {
        this.params.title = this.params.title || 'SIS Configuration - Battery Hall SIS';
        this.params.cancelText = this.params.cancelText || 'Close';
        super.init();

        this.container.className += ' sis-threshold-minigame-container';
        this.gameContainer.className += ' sis-threshold-minigame-game-container';

        this.setScenarioGlobal('sis_config_seen', true);
        this.render();
        this.bindEvents();
        this.subscribeCertificationGate();
    }

    render() {
        const container = document.createElement('div');
        container.className = 'sis-threshold';

        const canCompare = this.hasCertificationDoc();

        const tableRows = this.rows.map((row, index) => {
            const status = normalizeStatus(row.status);
            const statusClass = status === 'RED' ? 'sis-status-red' : status === 'AMBER' ? 'sis-status-amber' : 'sis-status-green';
            const clickableClass = status === 'GREEN' ? '' : 'sis-row-clickable';

            return `
                <tr class="sis-row ${clickableClass}" data-row-index="${index}" data-clickable="${status !== 'GREEN'}"${status === 'GREEN' ? '' : ' tabindex="0"'}>
                    <td>
                        <div>${wrapAtUnderscores(escapeHtml(displayDashes(row.parameter || '')))}</div>
                        <div class="sis-row-meta">${escapeHtml(displayDashes(row.lastModified || ''))} | ${escapeHtml(displayDashes(row.modifiedBy || ''))}</div>
                    </td>
                    <td data-label="Current Value">${escapeHtml(displayDashes(row.currentValue || ''))}</td>
                    <td class="${statusClass}" data-label="Status">${escapeHtml(status)}</td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="sis-threshold-main">
            <table class="sis-threshold-table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Current Value</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            <div class="sis-actions">
                <button class="sis-btn sis-btn-compare" id="sis-compare-btn" ${canCompare ? '' : 'disabled'}>${escapeHtml(displayDashes(this.compareTitle))}</button>
                <button class="sis-btn sis-btn-confirm" id="sis-confirm-btn" ${canCompare ? '' : 'disabled aria-describedby="sis-confirm-reason"'}>${escapeHtml(displayDashes(this.confirmLabel))}</button>
            </div>
            <div class="sis-confirm-reason" id="sis-confirm-reason" role="status">${canCompare ? '' : escapeHtml(SIS_CONFIRM_LOCKED_TEXT)}</div>
            <div class="sis-help" id="sis-help-text">
                ${escapeHtml(sisHelpText(canCompare, this.rows.filter((r) => normalizeStatus(r.status) !== 'GREEN').length))}
            </div>
            </div>
        `;

        this.gameContainer.appendChild(container);

        // The pop-up layer covers the whole window (not the scrolling body), so a pop-up
        // opened on a scrolled form is always on screen
        this.overlayEl = document.createElement('div');
        this.overlayEl.className = 'sis-overlay';
        this.overlayEl.id = 'sis-detail-overlay';
        this.container.appendChild(this.overlayEl);
        this.helpTextEl = container.querySelector('#sis-help-text');
    }

    // Enable Compare and Confirm once the certification record has been seen. The server
    // still decides whether the tamper report counts.
    refreshCertificationGate() {
        const seen = this.hasCertificationDoc();
        const compareBtn = this.gameContainer?.querySelector?.('#sis-compare-btn');
        const confirmBtn = this.gameContainer?.querySelector?.('#sis-confirm-btn');
        const reason = this.gameContainer?.querySelector?.('#sis-confirm-reason');
        if (compareBtn) compareBtn.disabled = !seen;
        if (confirmBtn) {
            confirmBtn.disabled = !seen;
            if (seen) confirmBtn.removeAttribute('aria-describedby');
            else confirmBtn.setAttribute('aria-describedby', 'sis-confirm-reason');
        }
        if (reason) reason.textContent = seen ? '' : SIS_CONFIRM_LOCKED_TEXT;
        if (this.helpTextEl) {
            this.helpTextEl.textContent = sisHelpText(seen, this.rows.filter((r) => normalizeStatus(r.status) !== 'GREEN').length);
        }
    }

    subscribeCertificationGate() {
        if (!window.eventDispatcher?.on) return;
        this._certHandler = () => this.refreshCertificationGate();
        this._certEvent = 'global_variable_changed:sis_certification_seen';
        window.eventDispatcher.on(this._certEvent, this._certHandler);
    }

    cleanup() {
        if (this._certHandler && window.eventDispatcher?.off) {
            window.eventDispatcher.off(this._certEvent, this._certHandler);
        }
        this._certHandler = null;
        super.cleanup();
    }

    bindEvents() {
        this.gameContainer.querySelectorAll('tr[data-clickable="true"]').forEach((rowEl) => {
            this.addEventListener(rowEl, 'click', () => {
                const index = Number(rowEl.getAttribute('data-row-index'));
                const row = this.rows[index];
                this._detailOpener = rowEl;
                this.showDetail(row);
            });
            // Keyboard: Enter or Space opens the same detail pop-up as a click
            this.addEventListener(rowEl, 'keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                event.stopPropagation();
                rowEl.click();
            });
        });

        const compareBtn = this.gameContainer.querySelector('#sis-compare-btn');
        if (compareBtn) {
            this.addEventListener(compareBtn, 'click', () => {
                if (!this.hasCertificationDoc()) return;
                this._detailOpener = compareBtn;   // focus comes back here when the dialog closes
                this.showCompare();
            });
        }

        const confirmBtn = this.gameContainer.querySelector('#sis-confirm-btn');
        if (confirmBtn) {
            this.addEventListener(confirmBtn, 'click', () => {
                if (!this.hasCertificationDoc()) return;
                this._detailOpener = confirmBtn;   // focus comes back here when the dialog closes
                this.showConfirm();
            });
        }
    }

    hasCertificationDoc() {
        if (window.gameState?.globalVariables?.sis_certification_seen === true) {
            return true;
        }

        const certTask = window.objectivesManager?.taskIndex?.find_certification_doc;
        if (certTask?.status === 'completed') {
            return true;
        }

        return false;
    }

    showDetail(row) {
        if (!this.overlayEl || !row) return;

        const detailText = row.detailText || 'This value deviates from the IEC 61511 certified baseline.';
        this.overlayEl.innerHTML = `
            <div class="sis-modal sis-modal-with-x">
                <button type="button" class="minigame-close-button sis-modal-close" id="sis-detail-close" aria-label="Close">&times;</button>
                <h4>${escapeHtml(displayDashes(row.parameter || 'Parameter Detail'))}</h4>
                <p>${escapeHtml(displayDashes(detailText))}</p>
            </div>
        `;
        this.overlayEl.classList.add('show');
        this._hideSceneX(true);
        this._lockPanel(true);

        const closeBtn = this.overlayEl.querySelector('#sis-detail-close');
        this.addEventListener(closeBtn, 'click', () => this.closeOverlay());
        // Keyboard focus moves into the pop-up so Tab does not walk the rows underneath
        closeBtn.focus({ preventScroll: true });
    }

    showCompare() {
        if (!this.overlayEl) return;

        const currentRows = this.rows.map((row) => {
            const status = normalizeStatus(row.status);
            const className = status === 'GREEN' ? 'sis-compare-item' : 'sis-compare-item sis-compare-item-alert';
            return `<div class="${className}">${wrapAtUnderscores(escapeHtml(displayDashes(row.parameter)))}: ${escapeHtml(displayDashes(row.currentValue))}</div>`;
        }).join('');

        const certifiedRows = this.rows.map((row) => {
            return `<div class="sis-compare-item">${wrapAtUnderscores(escapeHtml(displayDashes(row.parameter)))}: ${escapeHtml(displayDashes(row.certifiedValue))}</div>`;
        }).join('');

        this.overlayEl.innerHTML = `
            <div class="sis-modal sis-modal-with-x">
                <button type="button" class="minigame-close-button sis-modal-close" id="sis-compare-close" aria-label="Close">&times;</button>
                <h4>${escapeHtml(displayDashes(this.compareTitle))}</h4>
                <div class="sis-compare-grid">
                    <div class="sis-compare-card">
                        <h5>Current SIS Values</h5>
                        ${currentRows}
                    </div>
                    <div class="sis-compare-card">
                        <h5>Certified Reference (IEC 61511)</h5>
                        ${certifiedRows}
                    </div>
                </div>
            </div>
        `;
        this.overlayEl.classList.add('show');
        this._hideSceneX(true);
        this._lockPanel(true);

        const closeBtn = this.overlayEl.querySelector('#sis-compare-close');
        this.addEventListener(closeBtn, 'click', () => this.closeOverlay());
        // Focus the X (the way out), so Tab does not walk the panel underneath
        closeBtn.focus({ preventScroll: true });
    }

    showConfirm() {
        if (!this.overlayEl) return;

        this.overlayEl.innerHTML = `
            <div class="sis-modal sis-modal-with-x">
                <button type="button" class="minigame-close-button sis-modal-close" id="sis-confirm-close" aria-label="Close">&times;</button>
                <h4>Confirm SIS Tamper Report</h4>
                <p>Report detected SIS setpoint deviations to security operations?</p>
                <div class="sis-modal-actions">
                    <button class="sis-btn sis-btn-confirm" id="sis-confirm-yes">Confirm Tamper Report</button>
                </div>
            </div>
        `;
        this.overlayEl.classList.add('show');
        this._hideSceneX(true);
        this._lockPanel(true);

        const closeBtn = this.overlayEl.querySelector('#sis-confirm-close');
        const yesBtn = this.overlayEl.querySelector('#sis-confirm-yes');
        this.addEventListener(closeBtn, 'click', () => this.closeOverlay());
        this.addEventListener(yesBtn, 'click', () => this.applyConfirm());
        closeBtn.focus({ preventScroll: true });
    }

    applyConfirm() {
        this.setScenarioGlobal('sis_tamper_confirmed', true);
        window.objectivesManager?.completeTask('confirm_sis_tamper');

        this.gameResult = {
            reported: true,
            source: 'sis-config-threshold'
        };

        this._detailOpener = null;   // the scene ends; nothing to hand focus back to
        this.closeOverlay();
        this.showSuccess('SIS tamper reported. Priya has been notified.', true, 900);
    }

    // Esc is Cancel on an open pop-up or confirm; with none open it closes the scene
    handleEscapeKey() {
        if (!this.overlayEl?.classList.contains('show')) return false;
        this.closeOverlay();
        return true;
    }

    closeOverlay() {
        if (!this.overlayEl) return;
        this.overlayEl.classList.remove('show');
        this.overlayEl.innerHTML = '';
        this._hideSceneX(false);
        this._lockPanel(false);
        // Hand focus back to the row that opened the detail
        const opener = this._detailOpener;
        this._detailOpener = null;
        if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    }

    // The panel's buttons and rows are out of reach (not focusable, not clickable) while a
    // dialog is open; the overlay is opaque, so they are not drawn through it either
    _lockPanel(locked) {
        const main = this.gameContainer?.querySelector?.('.sis-threshold-main');
        if (!main) return;
        if (locked) main.setAttribute('inert', ''); else main.removeAttribute('inert');
    }

    // One X on screen at a time: every pop-up carries its own X (the confirm adds its one
    // named button), so the scene X hides while the overlay is open
    _hideSceneX(hidden) {
        const x = this.container?.querySelector?.('#minigame-close');
        if (x) x.style.visibility = hidden ? 'hidden' : '';
    }

    setScenarioGlobal(name, value) {
        if (window.npcManager?.setGlobalVariable) {
            window.npcManager.setGlobalVariable(name, value);
        }

        if (!window.gameState) window.gameState = {};
        if (!window.gameState.globalVariables) window.gameState.globalVariables = {};

        const oldValue = window.gameState.globalVariables[name];
        window.gameState.globalVariables[name] = value;

        if (window.npcConversationStateManager) {
            window.npcConversationStateManager.broadcastGlobalVariableChange(name, value, null);
        }

        if (window.eventDispatcher) {
            window.eventDispatcher.emit(`global_variable_changed:${name}`, {
                name,
                value,
                oldValue
            });
        }
    }
}

export function startSisConfigThresholdMinigame(sprite = null) {
    if (!window.MinigameFramework) {
        console.error('[SIS] MinigameFramework not available');
        return;
    }

    const scenarioData = sprite?.scenarioData || {};
    const minigameData = scenarioData.minigameData || {};

    const params = {
        title: minigameData.title || scenarioData.name || 'SIS Configuration Panel',
        rows: Array.isArray(minigameData.rows) ? minigameData.rows : [],
        compareTitle: minigameData.compareTitle || 'Compare with Certification Document',
        confirmLabel: minigameData.confirmLabel || 'Confirm SIS Tamper - Report to Security'
    };

    window.MinigameFramework.startMinigame('sis-config-threshold', null, {
        ...params
    });
}
