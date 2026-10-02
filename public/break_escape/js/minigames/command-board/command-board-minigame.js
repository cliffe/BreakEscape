import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

const STATE_KEY = 'mg12_command_board_state';

const PRESEED_ENTRIES = [
    {
        timestamp: 'Mon 22:38',
        text: 'MAJOR INCIDENT DECLARED - Enterprise IT systems encrypted.',
        type: 'security',
        source: 'preseed',
        eventKey: 'preseed:major_incident_declared'
    }
];

const STATUS_ROW_KEYS = {
    EHR: 'ehr',
    MONITORING: 'monitoring',
    FLEET: 'fleet',
    BACKUPS: 'backups',
    NETWORK: 'network',
    RANSOMWARE: 'ransomware'
};

const STATUS_CONFIG = [
    { key: STATUS_ROW_KEYS.EHR, label: 'EHR SYSTEM' },
    { key: STATUS_ROW_KEYS.MONITORING, label: 'WARD 7 MONITORING' },
    { key: STATUS_ROW_KEYS.FLEET, label: 'FLEET CONSOLE' },
    { key: STATUS_ROW_KEYS.BACKUPS, label: 'BACKUPS' },
    { key: STATUS_ROW_KEYS.NETWORK, label: 'NETWORK' },
    { key: STATUS_ROW_KEYS.RANSOMWARE, label: 'RANSOMWARE' }
];

const EVENT_DEFINITIONS = [
    {
        id: 'network_isolated_authorised',
        event: 'global_variable_changed:network_isolated',
        shouldAppend: (globals) => globals.network_isolated === true && globals.network_isolation_authorised === true,
        text: 'NETWORK ISOLATED (AUTHORISED) - Dual sign-off confirmed. Clinical zone severed from enterprise; ward central monitoring remains offline.',
        type: 'response'
    },
    {
        id: 'network_isolated_bypassed',
        event: 'global_variable_changed:network_isolated',
        shouldAppend: (globals) => globals.network_isolated === true && globals.network_isolation_authorised !== true,
        text: 'NETWORK ISOLATED (BYPASSED) - Isolation executed without dual sign-off; governance breach recorded. Ward central monitoring remains offline.',
        type: 'response'
    },
    {
        id: 'backup_recovery_cloud',
        event: 'global_variable_changed:backup_recovery_source',
        shouldAppend: (globals) => normalizeBackupRecoverySource(globals.backup_recovery_source) === 'CLOUD',
        text: 'CLOUD RESTORE INITIATED - EHR recovery ETA 18 hours; ward monitoring remains on bedside/manual observation in this response window.',
        type: 'response'
    },
    {
        id: 'backup_recovery_local',
        event: 'global_variable_changed:backup_recovery_source',
        shouldAppend: (globals) => {
            const value = normalizeBackupRecoverySource(globals.backup_recovery_source);
            return value === 'NAS' || value === 'TAPE';
        },
        text: (globals) => {
            const value = normalizeBackupRecoverySource(globals.backup_recovery_source);
            return `RECOVERY ATTEMPTED FROM ${value} - WARNING: Source may be compromised`;
        },
        type: 'decision'
    },
    {
        id: 'drug_library_verified',
        event: 'global_variable_changed:drug_library_verified',
        shouldAppend: (globals) => globals.drug_library_verified === true,
        text: 'DRUG LIBRARY TAMPERED - Morphine dose max altered. Pump verification required.',
        type: 'security'
    },
    {
        id: 'patient_bed4_critical',
        event: 'global_variable_changed:patient_bed4_state',
        shouldAppend: (globals) => String(globals.patient_bed4_state || '').toUpperCase() === 'CRITICAL',
        text: 'PATIENT DETERIORATION - Ward 7 Bed 4. Cardiac arrhythmia. Central monitoring unavailable; bedside alarm escalation required.',
        type: 'critical'
    },
    {
        id: 'patient_bed4_deceased',
        event: 'global_variable_changed:patient_bed4_state',
        shouldAppend: (globals) => String(globals.patient_bed4_state || '').toUpperCase() === 'DECEASED',
        text: 'PATIENT DEATH - Ward 7 Bed 4. Cardiac arrhythmia. No central monitoring response. Clinical team response delayed 22 minutes.',
        type: 'critical'
    },
    {
        id: 'patient_bed2_critical',
        event: 'global_variable_changed:patient_bed2_state',
        shouldAppend: (globals) => String(globals.patient_bed2_state || '').toUpperCase() === 'CRITICAL'
            && globals.drug_library_compromised === true,
        text: 'PATIENT DETERIORATION - Ward 7 Bed 2. Opioid toxicity suspected. Smart pump guardrails failed.',
        type: 'critical'
    },
    {
        id: 'patient_bed2_deceased',
        event: 'global_variable_changed:patient_bed2_state',
        shouldAppend: (globals) => String(globals.patient_bed2_state || '').toUpperCase() === 'DECEASED',
        text: 'PATIENT DEATH - Ward 7 Bed 2. Morphine overdose. Smart pump guardrails disabled by drug library tampering. Dose error unchallenged.',
        type: 'critical'
    },
    {
        id: 'ico_notified',
        event: 'global_variable_changed:ico_notified',
        shouldAppend: (globals) => globals.ico_notified === true,
        text: 'ICO NOTIFIED - 72hr statutory notification submitted',
        type: 'decision'
    },
    {
        id: 'ico_deadline_missed',
        event: 'global_variable_changed:ico_deadline_missed',
        shouldAppend: (globals) => globals.ico_deadline_missed === true,
        text: 'ICO NOTIFICATION DEADLINE MISSED - 72-hour GDPR window expired.',
        type: 'critical'
    },
    {
        id: 'backup_reinfected',
        event: 'global_variable_changed:backup_reinfected',
        shouldAppend: (globals) => globals.backup_reinfected === true,
        text: 'EHR RESTORE FAILED - Ransomware reactivated from backup. Second rebuild required. Clinical operations extended by 5 days.',
        type: 'critical'
    },
    {
        id: 'siem_escalated',
        event: 'global_variable_changed:siem_escalated',
        shouldAppend: (globals) => globals.siem_escalated === true,
        text: 'SIEM ALERTS ESCALATED - Critical indicators identified',
        type: 'response'
    },
    {
        id: 'siem_missed_alerts',
        event: 'global_variable_changed:siem_missed_alerts',
        shouldAppend: (globals) => globals.siem_missed_alerts === true,
        text: 'CRITICAL ALERTS MISSED - delayed escalation',
        type: 'security'
    },
    {
        id: 'ncsc_notified',
        event: 'global_variable_changed:ncsc_notified',
        shouldAppend: (globals) => globals.ncsc_notified === true,
        text: 'NCSC NOTIFIED - incident support request submitted',
        type: 'decision'
    },
    {
        id: 'vpn_anomaly_identified',
        event: 'global_variable_changed:vpn_anomaly_identified',
        shouldAppend: (globals) => globals.vpn_anomaly_identified === true,
        text: 'VPN ANOMALY CONFIRMED - Contractor credentials used from Romanian IP, no MFA',
        type: 'security'
    },
    {
        id: 'safety_claim_hc001_assessed',
        event: 'global_variable_changed:safety_claim_hc001_assessed',
        shouldAppend: (globals) => globals.safety_claim_hc001_assessed === true,
        text: 'SAFETY CLAIM ASSESSED - CLAIM-HC-001 (Network Segmentation) INVALIDATED. Dual-homed workstations and legacy flat segments breach the claim conditions.',
        type: 'decision'
    },
    {
        id: 'safety_claim_hc003_assessed',
        event: 'global_variable_changed:safety_claim_hc003_assessed',
        shouldAppend: (globals) => globals.safety_claim_hc003_assessed === true,
        text: 'SAFETY CLAIM ASSESSED - CLAIM-HC-003 (Drug Library Integrity) INVALIDATED. Library tampered; change control bypassed; pharmacy approval not obtained.',
        type: 'decision'
    },
    {
        id: 'safety_claim_hc007_assessed',
        event: 'global_variable_changed:safety_claim_hc007_assessed',
        shouldAppend: (globals) => globals.safety_claim_hc007_assessed === true,
        text: 'SAFETY CLAIM ASSESSED - CLAIM-HC-007 (Integrated Incident Response). Dual-authorisation process engaged. Clinical impact assessed before isolation.',
        type: 'decision'
    },
    {
        id: 'patient_bed4_attended',
        event: 'global_variable_changed:patient_bed4_state',
        shouldAppend: (globals) => String(globals.patient_bed4_state || '').toUpperCase() === 'ATTENDED',
        text: 'BED 4 PATIENT ESCALATED - Clinical team responding',
        type: 'response',
        optional: true
    },
    {
        id: 'paper_charts_collected',
        event: 'global_variable_changed:paper_charts_collected',
        shouldAppend: (globals) => globals.paper_charts_collected === true,
        text: 'PAPER MAR CHARTS RETRIEVED',
        type: 'response',
        optional: true
    },
    {
        id: 'pump_dose_correct',
        event: 'global_variable_changed:pump_dose_correct',
        shouldAppend: (globals) => globals.pump_dose_correct === true,
        text: 'BEDSIDE PUMP PROGRAMMED - Dose verified correct',
        type: 'clinical',
        optional: true
    },
    {
        id: 'pump_dose_error_caught',
        event: 'global_variable_changed:pump_dose_error',
        shouldAppend: (globals) => globals.pump_dose_error === true && globals.drug_library_compromised !== true,
        text: 'BEDSIDE PUMP PROGRAMMED - Double-check error caught',
        type: 'clinical',
        optional: true
    }
];

function normalizeBackupRecoverySource(value) {
    const raw = String(value || '').toUpperCase();
    if (raw === 'CLOUD_VENDOR') return 'CLOUD';
    if (raw === 'NAS_ENCRYPTED') return 'NAS';
    if (raw === 'TAPE_WIPED') return 'TAPE';
    return raw;
}

function formatDisplayTimestamp(date = new Date()) {
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

        this._clockInterval = setInterval(() => {
            this.updateHeaderClock();
        }, 60000);
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

        const uniqueEvents = Array.from(new Set(EVENT_DEFINITIONS.map((definition) => definition.event)));

        uniqueEvents.forEach((eventName) => {
            const handler = () => {
                this.evaluateAndAppendAllEvents();
                this.renderStatusPanel(true);
                this.updateStatusDots();
            };

            window.eventDispatcher.on(eventName, handler);
            this._eventSubs.push({ event: eventName, handler });
        });
    }

    unsubscribeScenarioEvents() {
        if (!window.eventDispatcher || !this._eventSubs.length) return;

        this._eventSubs.forEach((sub) => window.eventDispatcher.off(sub.event, sub.handler));
        this._eventSubs = [];
    }

    getGlobals() {
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.globalVariables) window.gameState.globalVariables = {};

        const globals = window.gameState.globalVariables;

        if (!globals.ward_monitor_status && globals.central_station_ward7_status) {
            globals.ward_monitor_status = globals.central_station_ward7_status;
        }

        const normalizedBackup = normalizeBackupRecoverySource(globals.backup_recovery_source);
        if (normalizedBackup) {
            globals.backup_recovery_source = normalizedBackup;
        } else if (globals.backup_restore_initiated === true) {
            globals.backup_recovery_source = 'CLOUD';
        }

        if (!globals.ico_notified && globals.ico_notification_sent === true) {
            globals.ico_notified = true;
        }

        return globals;
    }

    evaluateAndAppendAllEvents() {
        const globals = this.getGlobals();

        EVENT_DEFINITIONS.forEach((definition) => {
            if (!definition.shouldAppend(globals)) {
                return;
            }

            this.appendAutoEntry(definition, globals);
        });
    }

    appendAutoEntry(definition, globals) {
        const eventKey = `event:${definition.id}`;
        if (this.hasEventKey(eventKey)) {
            return;
        }

        const entryText = typeof definition.text === 'function'
            ? definition.text(globals)
            : definition.text;

        this.entries.unshift({
            timestamp: formatDisplayTimestamp(new Date()),
            text: entryText,
            type: definition.type,
            source: 'auto',
            eventKey
        });

        this.renderTimeline();
        this.persistState();

        if (isCriticalType(definition.type)) {
            this.pulseHeaderCritical();
        }
    }

    appendManualEntry(text) {
        this.entries.unshift({
            timestamp: formatDisplayTimestamp(new Date()),
            text,
            type: 'decision',
            source: 'manual',
            eventKey: `manual:${Date.now()}:${Math.random().toString(16).slice(2, 8)}`
        });

        this.manualEntryCount += 1;
        this.renderTimeline();
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
                        <div class="cb-header-title">NORTHGATE GENERAL HOSPITAL - MAJOR INCIDENT RESPONSE</div>
                        <div class="cb-header-subtitle">LIVE INCIDENT BOARD</div>
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
    }

    renderTimeline() {
        if (!this.timelineListEl) return;

        this.timelineListEl.innerHTML = '';

        this.entries.forEach((entry, index) => {
            const tile = document.createElement('article');
            tile.className = `cb-entry-tile ${index === 0 ? 'slide-in' : ''}`;

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

        const globals = this.getGlobals();
        const statuses = this.computeStatuses(globals);

        this.statusListEl.innerHTML = '';

        STATUS_CONFIG.forEach((rowConfig) => {
            const rowStatus = statuses[rowConfig.key];
            const row = document.createElement('div');
            row.className = 'cb-status-row';

            const badgeClass = `state-${rowStatus.key.toLowerCase()}`;

            row.innerHTML = `
                <span class="cb-status-label">${rowConfig.label}</span>
                <span class="cb-status-badge ${badgeClass}">${rowStatus.label}</span>
            `;

            const oldKey = this.statusStateCache.get(rowConfig.key);
            if (animateChanges && oldKey && oldKey !== rowStatus.key) {
                const badge = row.querySelector('.cb-status-badge');
                badge?.classList.add('flash');
            }

            this.statusStateCache.set(rowConfig.key, rowStatus.key);
            this.statusListEl.appendChild(row);
        });
    }

    computeStatuses(globals) {
        const inferredEhr = globals.network_isolated === true ? 'OFFLINE' : 'ONLINE';
        const inferredFleet = globals.network_isolated === true ? 'OFFLINE' : 'ONLINE';
        const inferredMonitoring = globals.ransomware_deployed === true ? 'OFFLINE' : 'UNKNOWN';

        const normalizedEhr = String(globals.ehr_status || inferredEhr).toUpperCase();
        const normalizedMonitoring = String(globals.ward_monitor_status || inferredMonitoring).toUpperCase();
        const normalizedFleet = String(globals.fleet_console_status || inferredFleet).toUpperCase();
        const normalizedBackup = normalizeBackupRecoverySource(globals.backup_recovery_source);

        const ehr = (() => {
            if (globals.backup_reinfected === true) return { key: 'REINFECTED', label: 'REINFECTED' };
            if (normalizedBackup === 'CLOUD') return { key: 'RESTORING', label: 'RESTORING' };
            if (normalizedEhr === 'OFFLINE') return { key: 'OFFLINE', label: 'OFFLINE' };
            if (normalizedEhr === 'ONLINE') return { key: 'OPERATIONAL', label: 'OPERATIONAL' };
            return { key: 'UNKNOWN', label: 'UNKNOWN' };
        })();

        const monitoring = (() => {
            if (normalizedMonitoring === 'OFFLINE') return { key: 'OFFLINE', label: 'OFFLINE' };
            if (normalizedMonitoring === 'STALE') return { key: 'DEGRADED', label: 'DEGRADED' };
            if (normalizedMonitoring === 'ONLINE') return { key: 'OPERATIONAL', label: 'OPERATIONAL' };
            return { key: 'UNKNOWN', label: 'UNKNOWN' };
        })();

        const fleet = (() => {
            if (globals.drug_library_compromised === true) return { key: 'COMPROMISED', label: 'COMPROMISED' };
            if (normalizedFleet === 'OFFLINE') return { key: 'OFFLINE', label: 'OFFLINE' };
            if (normalizedFleet === 'ONLINE') return { key: 'OPERATIONAL', label: 'OPERATIONAL' };
            return { key: 'UNKNOWN', label: 'UNKNOWN' };
        })();

        const backups = (() => {
            if (globals.backup_reinfected === true) return { key: 'REINFECTED', label: 'REINFECTED' };
            if (normalizedBackup === 'CLOUD') return { key: 'RESTORING', label: 'CLOUD' };
            if (normalizedBackup === 'NAS') return { key: 'COMPROMISED', label: 'NAS RISK' };
            if (normalizedBackup === 'TAPE') return { key: 'OFFLINE', label: 'TAPE WIPED' };
            if (globals.backup_restore_initiated === true) return { key: 'RESTORING', label: 'RESTORING' };
            return { key: 'UNKNOWN', label: 'UNKNOWN' };
        })();

        const network = globals.network_isolated === true
            ? { key: 'ISOLATED', label: 'ISOLATED' }
            : { key: 'CONNECTED', label: 'CONNECTED' };

        const ransomware = globals.ransomware_deployed === true
            ? { key: 'ACTIVE', label: 'ACTIVE' }
            : { key: 'CLEAN', label: 'CLEAN' };

        return {
            [STATUS_ROW_KEYS.EHR]: ehr,
            [STATUS_ROW_KEYS.MONITORING]: monitoring,
            [STATUS_ROW_KEYS.FLEET]: fleet,
            [STATUS_ROW_KEYS.BACKUPS]: backups,
            [STATUS_ROW_KEYS.NETWORK]: network,
            [STATUS_ROW_KEYS.RANSOMWARE]: ransomware
        };
    }

    updateHeaderClock() {
        if (!this.clockEl) return;
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        this.clockEl.textContent = `${hh}:${mm}`;
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
        const globals = this.getGlobals();
        globals[STATE_KEY] = {
            entries: this.entries,
            manualEntryCount: this.manualEntryCount
        };
    }

    restoreState() {
        const globals = this.getGlobals();
        const persisted = globals[STATE_KEY];

        if (persisted && Array.isArray(persisted.entries) && persisted.entries.length > 0) {
            this.entries = persisted.entries;
            this.manualEntryCount = Number(persisted.manualEntryCount || 0);
            return;
        }

        this.entries = PRESEED_ENTRIES.map((entry) => ({ ...entry }));
        this.manualEntryCount = 0;
    }
}
