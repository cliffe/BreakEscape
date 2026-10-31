import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

const DEFAULT_OFFLINE_MESSAGE = [
    'SYSTEM UNAVAILABLE',
    '',
    'Electronic Health Record service is unreachable.',
    'Network connectivity to EHR server: FAILED',
    '',
    'Do not attempt to prescribe from memory.',
    'Use paper MAR charts from the desk drawer.',
    '',
    'Contact IT Security if this persists.'
].join('\n');

const DEFAULT_PATIENTS = [
    {
        id: 'TEST-001',
        name: 'A. Okafor',
        dob: '1984-07-19',
        ward: 'Ward 7',
        bed: 'Bed 2',
        consultant: 'Dr Hartley',
        allergies: [
            { allergen: 'Penicillin', severity: 'SEVERE' }
        ],
        medications: [
            {
                drug: 'Morphine',
                dose: '10 mg',
                frequency: 'PRN',
                route: 'IV',
                interactionWarning: 'Manual pharmacy check advised'
            }
        ],
        prescriptions: [
            {
                drug: 'Morphine',
                currentDose: 10,
                safeMin: 5,
                safeMax: 15,
                unit: 'mg'
            }
        ]
    }
];

// Every use is a visible text sink, so " -- " is shown as an en dash here.
function escapeHtml(value) {
    return displayDashes(String(value || ''))
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function setGlobalAndNotify(varName, value) {
    if (!window.gameState) {
        window.gameState = {};
    }

    if (!window.gameState.globalVariables) {
        window.gameState.globalVariables = {};
    }

    if (window.npcManager && typeof window.npcManager.setGlobalVariable === 'function') {
        window.npcManager.setGlobalVariable(varName, value);
        return;
    }

    const oldValue = window.gameState.globalVariables[varName];
    window.gameState.globalVariables[varName] = value;

    if (window.npcConversationStateManager) {
        window.npcConversationStateManager.broadcastGlobalVariableChange(varName, value, null);
    }

    if (window.eventDispatcher) {
        window.eventDispatcher.emit(`global_variable_changed:${varName}`, {
            name: varName,
            value,
            oldValue
        });
    }
}

function resolveEhrStatus(globalVariables, fallbackStatus = 'offline') {
    const globals = globalVariables || {};

    if (typeof globals.ehr_status === 'string' && globals.ehr_status.trim().length > 0) {
        return globals.ehr_status.toLowerCase();
    }

    if (globals.network_isolated === true) {
        return 'offline';
    }

    return fallbackStatus;
}

export class EhrTerminalMinigame extends MinigameScene {
    constructor(container, params = {}) {
        super(container, {
            ...params,
            title: params.title || 'EHR Prescribing Terminal',
            showCancel: true,
            cancelText: params.cancelText || 'Close Terminal'
        });

        this.lockable = params.lockable || null;
        this.ehrStatus = resolveEhrStatus(window.gameState?.globalVariables, params.ehrStatus || 'offline');
        const _ehrMd = this.lockable?.scenarioData?.minigameData || {};
        this.offlineMessage = params.customMessage || _ehrMd.customMessage || DEFAULT_OFFLINE_MESSAGE;
        this.patients = params.patients || _ehrMd.patients || DEFAULT_PATIENTS;
        this.selectedPatientIndex = 0;
    }

    init() {
        super.init();

        this.container.className += ' ehr-terminal-minigame-container';
        this.gameContainer.className += ' ehr-terminal-minigame-game-container';
        this.headerElement.style.display = 'none';

        this.render();
    }

    start() {
        super.start();

        // Always read current runtime global state when the minigame opens.
        this.ehrStatus = resolveEhrStatus(window.gameState?.globalVariables, this.ehrStatus || 'offline');
        this.render();

        if (this.ehrStatus === 'offline') {
            setGlobalAndNotify('ehr_terminal_viewed_offline', true);
        }

        const acknowledgeButton = this.gameContainer.querySelector('#ehr-terminal-acknowledge');
        if (acknowledgeButton) {
            this.addEventListener(acknowledgeButton, 'click', () => {
                this.complete(false);
            });
        }

        const patientRows = this.gameContainer.querySelectorAll('[data-patient-index]');
        patientRows.forEach((row) => {
            this.addEventListener(row, 'click', () => {
                this.selectedPatientIndex = Number(row.getAttribute('data-patient-index')) || 0;
                setGlobalAndNotify('ehr_terminal_viewed_online', true);
                this.render();

                const rebindRows = this.gameContainer.querySelectorAll('[data-patient-index]');
                rebindRows.forEach((rebuiltRow) => {
                    this.addEventListener(rebuiltRow, 'click', () => {
                        this.selectedPatientIndex = Number(rebuiltRow.getAttribute('data-patient-index')) || 0;
                        setGlobalAndNotify('ehr_terminal_viewed_online', true);
                        this.render();
                    });
                });
            });
        });
    }

    renderOnlineBody() {
        const patients = Array.isArray(this.patients) && this.patients.length > 0 ? this.patients : DEFAULT_PATIENTS;
        const selected = patients[Math.min(this.selectedPatientIndex, patients.length - 1)] || patients[0];

        const patientRows = patients.map((patient, index) => {
            const hasAllergy = Array.isArray(patient.allergies) && patient.allergies.length > 0;
            const rowClass = index === this.selectedPatientIndex ? ' selected' : '';
            return `
                <button class="ehr-patient-row${rowClass}" type="button" data-patient-index="${index}">
                    <span class="ehr-patient-name">${escapeHtml(patient.name || 'Unknown')}</span>
                    <span class="ehr-patient-bed">${escapeHtml(`${patient.ward || 'Ward ?'} ${patient.bed || ''}`.trim())}</span>
                    <span class="ehr-patient-allergy-dot ${hasAllergy ? 'allergy' : 'none'}" aria-hidden="true"></span>
                </button>
            `;
        }).join('');

        const allergies = Array.isArray(selected.allergies) ? selected.allergies : [];
        const medications = Array.isArray(selected.medications) ? selected.medications : [];
        const prescriptions = Array.isArray(selected.prescriptions) ? selected.prescriptions : [];

        const allergyMarkup = allergies.length > 0
            ? `<div class="ehr-allergy-box has-allergy">${allergies.map((entry) => `${escapeHtml(entry.allergen || 'Unknown')} (${escapeHtml(entry.severity || 'UNKNOWN')})`).join('<br>')}</div>`
            : '<div class="ehr-allergy-box no-allergy">NO KNOWN ALLERGIES</div>';

        const medicationRows = medications.length > 0
            ? medications.map((med) => `
                <tr>
                    <td>${escapeHtml(med.drug || '')}</td>
                    <td>${escapeHtml(med.dose || '')}</td>
                    <td>${escapeHtml(med.frequency || '')}</td>
                    <td>${escapeHtml(med.route || '')}</td>
                    <td>${med.interactionWarning ? '!' : ''}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="5">No active medications</td></tr>';

        const prescriptionBars = prescriptions.length > 0
            ? prescriptions.map((rx) => {
                const min = Number(rx.safeMin || 0);
                const max = Number(rx.safeMax || 1);
                const current = Number(rx.currentDose || min);
                const pct = max > min ? Math.max(0, Math.min(100, ((current - min) / (max - min)) * 100)) : 0;
                return `
                    <div class="ehr-dose-row">
                        <div class="ehr-dose-label">${escapeHtml(rx.drug || 'Dose')} ${escapeHtml(String(current))}${escapeHtml(rx.unit || '')} (safe ${escapeHtml(String(min))}-${escapeHtml(String(max))}${escapeHtml(rx.unit || '')})</div>
                        <div class="ehr-dose-bar"><span style="left:${pct}%"></span></div>
                    </div>
                `;
            }).join('')
            : '<div class="ehr-dose-row"><div class="ehr-dose-label">No active prescriptions</div></div>';

        return `
            <div class="ehr-online-layout">
                <div class="ehr-patient-list">${patientRows}</div>
                <div class="ehr-record-panel">
                    <div class="ehr-demographics">
                        NAME: ${escapeHtml(selected.name || 'Unknown')}<br>
                        DOB: ${escapeHtml(selected.dob || 'Unknown')}<br>
                        WARD: ${escapeHtml(selected.ward || 'Unknown')} ${escapeHtml(selected.bed || '')}<br>
                        CONSULTANT: ${escapeHtml(selected.consultant || 'Unknown')}
                    </div>
                    ${allergyMarkup}
                    <table class="ehr-medications-table">
                        <thead><tr><th>DRUG</th><th>DOSE</th><th>FREQ</th><th>ROUTE</th><th>WARN</th></tr></thead>
                        <tbody>${medicationRows}</tbody>
                    </table>
                    <div class="ehr-dose-block">${prescriptionBars}</div>
                </div>
            </div>
            <button id="ehr-terminal-acknowledge" class="ehr-terminal-button" type="button">[CLOSE TERMINAL]</button>
        `;
    }

    render() {
        const isOnline = this.ehrStatus === 'online';
        this.gameContainer.classList.toggle('ehr-online-mode', isOnline);
        const badgeText = isOnline ? '[ONLINE]' : '[OFFLINE]';
        const badgeClass = isOnline ? 'online' : 'offline';
        const safeMessage = escapeHtml(this.offlineMessage);
        const bodyMarkup = isOnline
            ? this.renderOnlineBody()
            : `
                <div class="ehr-terminal-offline-icon" aria-hidden="true">!</div>
                <pre class="ehr-terminal-message">${safeMessage}</pre>
                <button id="ehr-terminal-acknowledge" class="ehr-terminal-button" type="button">[UNDERSTOOD]</button>
            `;

        this.gameContainer.innerHTML = `
            <div class="ehr-terminal-panel">
                <div class="ehr-terminal-header">
                    <span class="ehr-terminal-title">NORTHGATE TRUST EHR - PRESCRIBING MODULE</span>
                    <span class="ehr-terminal-status ${badgeClass}">${badgeText}</span>
                </div>

                <div class="ehr-terminal-content">
                    ${bodyMarkup}
                </div>
            </div>
        `;
    }
}
