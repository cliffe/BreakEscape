import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

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

export class SisConfigThresholdMinigame extends MinigameScene {
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

        // Keep SIS panel footprint similar to PIN minigame and style as translucent panel.
        this.container.className += ' sis-threshold-minigame-container';
        this.gameContainer.className += ' sis-threshold-minigame-game-container';

        this.setScenarioGlobal('sis_config_seen', true);
        this.render();
        this.bindEvents();
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
                <tr class="sis-row ${clickableClass}" data-row-index="${index}" data-clickable="${status !== 'GREEN'}">
                    <td>
                        <div>${displayDashes(row.parameter || '')}</div>
                        <div class="sis-row-meta">${displayDashes(row.lastModified || '')} | ${displayDashes(row.modifiedBy || '')}</div>
                    </td>
                    <td>${displayDashes(row.currentValue || '')}</td>
                    <td class="${statusClass}">${status}</td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="sis-threshold-header">SIS CONFIGURATION - BATTERY HALL SIS</div>
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
                <button class="sis-btn sis-btn-compare" id="sis-compare-btn" ${canCompare ? '' : 'disabled'}>${displayDashes(this.compareTitle)}</button>
                <button class="sis-btn sis-btn-confirm" id="sis-confirm-btn">${displayDashes(this.confirmLabel)}</button>
            </div>
            <div class="sis-help" id="sis-help-text">
                ${canCompare ? 'Select highlighted rows to inspect deviations.' : 'Retrieve the SIS certification document to unlock side-by-side comparison.'}
            </div>
            <div class="sis-overlay" id="sis-detail-overlay"></div>
        `;

        this.gameContainer.appendChild(container);

        this.overlayEl = container.querySelector('#sis-detail-overlay');
        this.helpTextEl = container.querySelector('#sis-help-text');
    }

    bindEvents() {
        this.gameContainer.querySelectorAll('tr[data-clickable="true"]').forEach((rowEl) => {
            this.addEventListener(rowEl, 'click', () => {
                const index = Number(rowEl.getAttribute('data-row-index'));
                const row = this.rows[index];
                this.showDetail(row);
            });
        });

        const compareBtn = this.gameContainer.querySelector('#sis-compare-btn');
        if (compareBtn) {
            this.addEventListener(compareBtn, 'click', () => {
                if (!this.hasCertificationDoc()) return;
                this.showCompare();
            });
        }

        const confirmBtn = this.gameContainer.querySelector('#sis-confirm-btn');
        if (confirmBtn) {
            this.addEventListener(confirmBtn, 'click', () => {
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
            <div class="sis-modal">
                <h4>${displayDashes(row.parameter || 'Parameter Detail')}</h4>
                <p>${displayDashes(detailText)}</p>
                <div class="sis-modal-actions">
                    <button class="sis-btn" id="sis-detail-close">Close</button>
                </div>
            </div>
        `;
        this.overlayEl.classList.add('show');

        const closeBtn = this.overlayEl.querySelector('#sis-detail-close');
        this.addEventListener(closeBtn, 'click', () => this.closeOverlay());
    }

    showCompare() {
        if (!this.overlayEl) return;

        const currentRows = this.rows.map((row) => {
            const status = normalizeStatus(row.status);
            const className = status === 'GREEN' ? 'sis-compare-item' : 'sis-compare-item sis-compare-item-alert';
            return `<div class="${className}">${wrapAtUnderscores(displayDashes(row.parameter))}: ${displayDashes(row.currentValue)}</div>`;
        }).join('');

        const certifiedRows = this.rows.map((row) => {
            return `<div class="sis-compare-item">${wrapAtUnderscores(displayDashes(row.parameter))}: ${displayDashes(row.certifiedValue)}</div>`;
        }).join('');

        this.overlayEl.innerHTML = `
            <div class="sis-modal">
                <h4>${displayDashes(this.compareTitle)}</h4>
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
                <div class="sis-modal-actions">
                    <button class="sis-btn" id="sis-compare-close">Close</button>
                </div>
            </div>
        `;
        this.overlayEl.classList.add('show');

        const closeBtn = this.overlayEl.querySelector('#sis-compare-close');
        this.addEventListener(closeBtn, 'click', () => this.closeOverlay());
    }

    showConfirm() {
        if (!this.overlayEl) return;

        this.overlayEl.innerHTML = `
            <div class="sis-modal">
                <h4>Confirm SIS Tamper Report</h4>
                <p>Report detected SIS setpoint deviations to security operations?</p>
                <div class="sis-modal-actions">
                    <button class="sis-btn" id="sis-confirm-no">Cancel</button>
                    <button class="sis-btn sis-btn-confirm" id="sis-confirm-yes">Confirm</button>
                </div>
            </div>
        `;
        this.overlayEl.classList.add('show');

        const noBtn = this.overlayEl.querySelector('#sis-confirm-no');
        const yesBtn = this.overlayEl.querySelector('#sis-confirm-yes');
        this.addEventListener(noBtn, 'click', () => this.closeOverlay());
        this.addEventListener(yesBtn, 'click', () => this.applyConfirm());
    }

    applyConfirm() {
        this.setScenarioGlobal('sis_tamper_confirmed', true);
        window.objectivesManager?.completeTask('confirm_sis_tamper');

        this.gameResult = {
            reported: true,
            source: 'sis-config-threshold'
        };

        this.closeOverlay();
        this.showSuccess('SIS tamper reported. Priya has been notified.', true, 900);
    }

    closeOverlay() {
        if (!this.overlayEl) return;
        this.overlayEl.classList.remove('show');
        this.overlayEl.innerHTML = '';
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
