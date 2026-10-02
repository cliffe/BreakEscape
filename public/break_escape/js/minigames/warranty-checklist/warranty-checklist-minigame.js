import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

const DEFAULT_TITLE = 'Warranty Compliance Checklist — MC-2023-ALBE-007';

const VERDICT_LABELS = {
    compliant: 'Compliant',
    arguable: 'Arguable',
    breached: 'Breached'
};

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Visible text: escaped, with " -- " shown as an en dash (display only; ids use escapeHtml).
function escapeText(value) {
    return escapeHtml(displayDashes(String(value ?? '')));
}

function ensureGlobalStores() {
    if (!window.gameState) window.gameState = {};
    if (!window.gameState.globalVariables) window.gameState.globalVariables = {};
    if (window.gameScenario && !window.gameScenario.globalVariables) {
        window.gameScenario.globalVariables = {};
    }
}

function readGlobal(varName) {
    const runtimeGlobals = window.gameState?.globalVariables || {};
    const scenarioGlobals = window.gameScenario?.globalVariables || {};
    if (Object.prototype.hasOwnProperty.call(runtimeGlobals, varName)) {
        return runtimeGlobals[varName];
    }
    return scenarioGlobals[varName];
}

function setGlobalAndNotify(varName, value) {
    ensureGlobalStores();
    const oldValue = readGlobal(varName);
    if (oldValue === value) return false;

    window.gameState.globalVariables[varName] = value;
    if (window.gameScenario?.globalVariables) {
        window.gameScenario.globalVariables[varName] = value;
    }
    if (window.npcConversationStateManager) {
        window.npcConversationStateManager.broadcastGlobalVariableChange(varName, value, null);
    }
    if (window.eventDispatcher) {
        window.eventDispatcher.emit(`global_variable_changed:${varName}`, { name: varName, value, oldValue });
    }
    return true;
}

export class WarrantyChecklistMinigame extends MinigameScene {
    constructor(container, params = {}) {
        super(container, {
            ...params,
            title: params.title || DEFAULT_TITLE,
            showCancel: false
        });

        const scenarioData = params.lockable?.scenarioData || {};
        const minigameData = scenarioData.minigameData || {};

        this.warranties = Array.isArray(params.warranties || minigameData.warranties)
            ? (params.warranties || minigameData.warranties)
            : [];

        this.verdicts = {};
        this.submitted = false;
    }

    init() {
        super.init();
        this.container.classList.add('wcc-minigame-container');
        this.gameContainer.classList.add('wcc-minigame-game-container');
        if (this.headerElement) {
            this.headerElement.style.display = 'none';
        }
        this.submitted = readGlobal('warranty_checklist_complete') === true;
        this.loadPersistedState();
        this.render();
    }

    start() {
        super.start();
        this.submitted = readGlobal('warranty_checklist_complete') === true;
        this.loadPersistedState();
        this.render();
    }

    loadPersistedState() {
        const store = window.gameState?.warrantyChecklist;
        if (store && typeof store === 'object') {
            this.verdicts = store.verdicts ? { ...store.verdicts } : {};
        }
    }

    persistState() {
        if (!window.gameState) window.gameState = {};
        window.gameState.warrantyChecklist = {
            verdicts: { ...this.verdicts }
        };
    }

    isEvidenceGatePassed() {
        return readGlobal('warranty_evidence_reviewed') === true;
    }

    allVerdictsSet() {
        return this.warranties.length > 0 && this.warranties.every(w => !!this.verdicts[w.id]);
    }

    canSubmit() {
        return this.isEvidenceGatePassed() && this.allVerdictsSet() && !this.submitted;
    }

    handleVerdictClick(warrantyId, verdict) {
        if (this.submitted) return;
        this.verdicts[warrantyId] = verdict;
        this.persistState();
        this.render();
    }

    handleSubmit() {
        if (!this.canSubmit()) return;

        setGlobalAndNotify('warranty_checklist_complete', true);
        setGlobalAndNotify('ins001_assessed', true);
        setGlobalAndNotify('ins003_assessed', true);

        this.submitted = true;
        this.persistState();
        this.render();

        if (window.gameAlert) {
            window.gameAlert('Warranty assessment submitted to Eleanor Vance.', 'success', 'Checklist Complete', 3000);
        }
    }

    getStatusInfo() {
        if (this.submitted) {
            return { text: 'Status: Assessment Submitted', className: 'ready' };
        }
        if (!this.isEvidenceGatePassed()) {
            return { text: 'Status: Evidence Review Required', className: 'locked' };
        }
        if (this.allVerdictsSet()) {
            return { text: 'Status: Ready to Submit', className: 'in-progress' };
        }
        return { text: 'Status: Verdicts Pending', className: 'pending' };
    }

    renderWarrantyRow(warranty) {
        const verdict = this.verdicts[warranty.id] || null;
        const isReadOnly = this.submitted;

        const verdictButtons = ['compliant', 'arguable', 'breached'].map(v => {
            const isSelected = verdict === v;
            const disabledAttr = isReadOnly ? 'disabled' : '';
            return `<button
                type="button"
                class="wcc-verdict-btn wcc-verdict-${v}${isSelected ? ' selected' : ''}"
                data-warranty="${escapeHtml(warranty.id)}"
                data-verdict="${v}"
                ${disabledAttr}
            >${VERDICT_LABELS[v]}</button>`;
        }).join('');

        const claimRefsHtml = Array.isArray(warranty.claimRefs) && warranty.claimRefs.length > 0
            ? warranty.claimRefs.map(r => `<span class="wcc-claim-refs">${escapeText(r)}</span>`).join('')
            : '';

        const verdictBadge = verdict
            ? `<span class="wcc-verdict-badge wcc-verdict-badge-${verdict}">${VERDICT_LABELS[verdict]}</span>`
            : '';

        const hintHtml = warranty.hint && !isReadOnly
            ? `<div class="wcc-hint">${escapeText(warranty.hint)}</div>`
            : '';

        return `
            <div class="wcc-row${verdict ? ` wcc-row-${verdict}` : ''}">
                <div class="wcc-row-header">
                    <span class="wcc-code">${escapeText(warranty.code)}</span>
                    <span class="wcc-row-title">${escapeText(warranty.title)}</span>
                    ${claimRefsHtml}
                    ${verdictBadge}
                </div>
                <div class="wcc-row-context">${escapeText(warranty.context || '')}</div>
                <div class="wcc-row-controls">
                    <div class="wcc-verdict-group">${verdictButtons}</div>
                </div>
                ${hintHtml}
            </div>
        `;
    }

    render() {
        const statusInfo = this.getStatusInfo();

        const gateNote = !this.isEvidenceGatePassed() && !this.submitted
            ? `<div class="wcc-gate-note">Review the Claims Management System quarterly reports and all three evidence packets (Exhibits A, B &amp; C) in the Evidence Archive before submitting this assessment.</div>`
            : '';

        const submitDisabled = !this.canSubmit() ? 'disabled' : '';
        const submitLabel = this.submitted ? 'Submitted' : 'Submit Assessment';

        const emptyState = this.warranties.length === 0
            ? '<div class="wcc-empty-state">No warranty data configured in scenario.</div>'
            : this.warranties.map(w => this.renderWarrantyRow(w)).join('');

        const prevScrollTop = this.gameContainer.querySelector('.wcc-doc-body')?.scrollTop || 0;

        this.gameContainer.innerHTML = `
            <div class="wcc-panel">
                <div class="wcc-desk">
                    <div class="wcc-paper">
                        <div class="wcc-letterhead">
                            <h2 class="wcc-letterhead-title">Meridian Cyber Insurance</h2>
                            <span class="wcc-letterhead-ref">MC-2023-ALBE-007</span>
                        </div>
                        <div class="wcc-doc-header">
                            <div class="wcc-doc-title">Warranty Compliance Checklist</div>
                            <div class="wcc-doc-meta">
                                <span>Albion Energy Storage Ltd</span>
                                <span class="wcc-doc-status wcc-status-${escapeText(statusInfo.className)}">${escapeText(statusInfo.text)}</span>
                            </div>
                            ${gateNote}
                            <div class="wcc-header-actions">
                                <button id="wcc-submit-btn" class="wcc-header-btn wcc-header-btn-submit" type="button" ${submitDisabled}>${escapeText(submitLabel)}</button>
                            </div>
                        </div>
                        <div class="wcc-doc-body">
                            ${emptyState}
                        </div>
                    </div>
                </div>
            </div>
            <div class="wcc-footer">
                <button id="wcc-close-btn" class="wcc-footer-btn" type="button">Close</button>
            </div>
        `;

        const body = this.gameContainer.querySelector('.wcc-doc-body');
        if (body && prevScrollTop > 0) {
            body.scrollTop = prevScrollTop;
        }

        this.bindEvents();
    }

    bindEvents() {
        const closeBtn = this.gameContainer.querySelector('#wcc-close-btn');
        if (closeBtn) {
            this.addEventListener(closeBtn, 'click', () => this.complete(false));
        }

        const submitBtn = this.gameContainer.querySelector('#wcc-submit-btn');
        if (submitBtn) {
            this.addEventListener(submitBtn, 'click', () => this.handleSubmit());
        }

        const verdictBtns = this.gameContainer.querySelectorAll('.wcc-verdict-btn:not([disabled])');
        verdictBtns.forEach(btn => {
            const warrantyId = btn.getAttribute('data-warranty');
            const verdict = btn.getAttribute('data-verdict');
            this.addEventListener(btn, 'click', () => this.handleVerdictClick(warrantyId, verdict));
        });
    }
}
