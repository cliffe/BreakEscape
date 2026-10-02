import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

const STATE_KEY = 'mg01_siem_state';

const SEVERITY_ORDER = {
    CRIT: 4,
    HIGH: 3,
    MED: 2,
    LOW: 1
};

function normalizeSeverity(severity) {
    const value = String(severity || '').toUpperCase();
    if (value === 'CRITICAL' || value === 'CRIT') return 'CRIT';
    if (value === 'HIGH') return 'HIGH';
    if (value === 'MEDIUM' || value === 'MED') return 'MED';
    return 'LOW';
}

function formatClock(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

function formatTimer(totalSeconds) {
    const safeSeconds = Math.max(0, totalSeconds);
    const mm = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
    const ss = String(safeSeconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}

function parseClockToSeconds(clockText) {
    const parts = String(clockText || '').split(':').map((part) => Number(part));
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return 0;
    return ((parts[0] * 3600) + (parts[1] * 60) + parts[2]) % 86400;
}

function formatSecondsToClock(totalSeconds) {
    const wrapped = ((Math.floor(totalSeconds) % 86400) + 86400) % 86400;
    const hh = String(Math.floor(wrapped / 3600)).padStart(2, '0');
    const mm = String(Math.floor((wrapped % 3600) / 60)).padStart(2, '0');
    const ss = String(wrapped % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

function getLatestAlertSecond(alerts = []) {
    if (!Array.isArray(alerts) || alerts.length === 0) return 0;
    return alerts.reduce((latest, alert) => {
        const seconds = parseClockToSeconds(alert?.timestamp);
        return Math.max(latest, seconds);
    }, 0);
}

const ALERT_SETS = {
    northgate_2025_11: [
        { id: 'NG-001', severity: 'LOW',  timestamp: '07:12:04', source: 'NETOPS-VLAN',    description: 'VLAN 30 migration route advertisement propagated',                         critical: false, status: 'pending' },
        { id: 'NG-002', severity: 'CRIT', timestamp: '07:12:21', source: 'FINWKS-047',     description: 'Encoded PowerShell execution — base64 encoded command',                   critical: true,  status: 'pending' },
        { id: 'NG-003', severity: 'LOW',  timestamp: '07:12:38', source: 'SWITCH-W7',      description: 'Spanning-tree topology change notification received',                      critical: false, status: 'pending' },
        { id: 'NG-004', severity: 'LOW',  timestamp: '07:12:55', source: 'BKP-SCH-01',     description: 'Nightly backup job completed — NHS-STORE-01',                             critical: false, status: 'pending' },
        { id: 'NG-005', severity: 'MED',  timestamp: '07:13:09', source: 'BKP-SCH-02',     description: 'Backup verification window started — differential snapshot',               critical: false, status: 'pending' },
        { id: 'NG-006', severity: 'LOW',  timestamp: '07:13:24', source: 'PRINT-MFD-04',   description: 'Print spool queue cleared after overnight batch',                          critical: false, status: 'pending' },
        { id: 'NG-007', severity: 'LOW',  timestamp: '07:13:41', source: 'NETOPS-VLAN',    description: 'VLAN 40 trunk reconfiguration applied to CLINWKS segment',                 critical: false, status: 'pending' },
        { id: 'NG-008', severity: 'CRIT', timestamp: '07:13:57', source: 'DC01',           description: 'LSASS memory access by non-system process',                               critical: true,  status: 'pending' },
        { id: 'NG-009', severity: 'LOW',  timestamp: '07:14:12', source: 'DHCP-SRV',       description: 'DHCP lease renewal burst — returning day-shift workstations',             critical: false, status: 'pending' },
        { id: 'NG-010', severity: 'MED',  timestamp: '07:14:28', source: 'DNS-INFRA',      description: 'Conditional forwarder policy sync completed',                              critical: false, status: 'pending' },
        { id: 'NG-011', severity: 'LOW',  timestamp: '07:14:45', source: 'SWITCH-W12',     description: 'Spanning-tree recalculation complete — topology stabilised',               critical: false, status: 'pending' },
        { id: 'NG-012', severity: 'LOW',  timestamp: '07:15:02', source: 'BKP-SCH-01',     description: 'Cloud backup retention policy check passed',                               critical: false, status: 'pending' },
        { id: 'NG-013', severity: 'HIGH', timestamp: '07:15:18', source: 'FILESERVER-02',  description: 'Anomalous SMB write volume — 847 files in 3 min',                         critical: true,  status: 'pending' },
        { id: 'NG-014', severity: 'MED',  timestamp: '07:15:35', source: 'FW-PERIMETER',   description: 'Temporary VLAN migration allowlist rule activated',                        critical: false, status: 'pending' },
        { id: 'NG-015', severity: 'LOW',  timestamp: '07:15:52', source: 'PRINT-MFD-02',   description: 'Printer offline alert cleared — paper tray refilled',                     critical: false, status: 'pending' },
        { id: 'NG-016', severity: 'LOW',  timestamp: '07:16:08', source: 'AUTH-SRV',       description: 'Routine Kerberos ticket renewal — clinical workstations',                 critical: false, status: 'pending' },
        { id: 'NG-017', severity: 'MED',  timestamp: '07:16:25', source: 'IDS-EDGE',       description: 'Port scan probe blocked from external address range',                     critical: false, status: 'pending' },
        { id: 'NG-018', severity: 'HIGH', timestamp: '07:16:41', source: 'FIREWALL-CORE',  description: 'RDP session: ENTPWKS-012 → CLINWKS-003 (cross-zone)',                    critical: true,  status: 'pending' },
        { id: 'NG-019', severity: 'LOW',  timestamp: '07:16:58', source: 'NETOPS-VLAN',    description: 'VLAN 50 route propagation verified — no anomalies',                       critical: false, status: 'pending' },
        { id: 'NG-020', severity: 'LOW',  timestamp: '07:17:14', source: 'PKI-SRV',        description: 'Certificate authority log rotation completed',                             critical: false, status: 'pending' },
        { id: 'NG-021', severity: 'MED',  timestamp: '07:17:31', source: 'VPN-GW',         description: 'Contractor VPN access window opened — scheduled maintenance',              critical: false, status: 'pending' },
        { id: 'NG-022', severity: 'LOW',  timestamp: '07:17:47', source: 'SYSLOG-COL',     description: 'Syslog collector reconnected after brief disconnect',                     critical: false, status: 'pending' },
        { id: 'NG-023', severity: 'LOW',  timestamp: '07:18:03', source: 'NETMON',         description: 'Monitoring heartbeat restored on clinical subnet probes',                 critical: false, status: 'pending' },
        { id: 'NG-024', severity: 'LOW',  timestamp: '07:18:19', source: 'SWITCH-W7',      description: 'Legacy switch port bounced — auto-recovery complete',                     critical: false, status: 'pending' }
    ]
};

function createSeededAlerts() {
    return [
        {
            id: 'ALRT-001',
            severity: 'CRIT',
            timestamp: '07:12:21',
            source: 'FINWKS-047',
            description: 'Encoded PowerShell execution chain detected',
            critical: true,
            status: 'pending'
        },
        {
            id: 'ALRT-002',
            severity: 'LOW',
            timestamp: '07:12:42',
            source: 'NETOPS-MIG',
            description: 'Expected VLAN migration route update applied',
            critical: false,
            status: 'pending'
        },
        {
            id: 'ALRT-003',
            severity: 'MED',
            timestamp: '07:13:15',
            source: 'BKP-SCH-02',
            description: 'Scheduled backup verification window started',
            critical: false,
            status: 'pending'
        },
        {
            id: 'ALRT-004',
            severity: 'LOW',
            timestamp: '07:13:38',
            source: 'SWITCH-W7',
            description: 'Legacy switch spanning-tree recalculation',
            critical: false,
            status: 'pending'
        },
        {
            id: 'ALRT-005',
            severity: 'CRIT',
            timestamp: '07:14:03',
            source: 'DC01',
            description: 'LSASS process memory access behavior flagged',
            critical: true,
            status: 'pending'
        },
        {
            id: 'ALRT-006',
            severity: 'MED',
            timestamp: '07:14:25',
            source: 'FW-CORE',
            description: 'Temporary migration allowlist entry consumed',
            critical: false,
            status: 'pending'
        },
        {
            id: 'ALRT-007',
            severity: 'LOW',
            timestamp: '07:14:54',
            source: 'VPN-GW',
            description: 'Known contractor access window opened',
            critical: false,
            status: 'pending'
        },
        {
            id: 'ALRT-008',
            severity: 'HIGH',
            timestamp: '07:15:16',
            source: 'FILE-SRV-03',
            description: 'Elevated SMB write activity during patch staging',
            critical: false,
            status: 'pending'
        },
        {
            id: 'ALRT-009',
            severity: 'LOW',
            timestamp: '07:15:44',
            source: 'NMS-POOL',
            description: 'Monitoring probe restart completed',
            critical: false,
            status: 'pending'
        },
        {
            id: 'ALRT-010',
            severity: 'MED',
            timestamp: '07:16:11',
            source: 'DNS-INFRA',
            description: 'Expected resolver policy sync from migration',
            critical: false,
            status: 'pending'
        },
        {
            id: 'ALRT-011',
            severity: 'LOW',
            timestamp: '07:16:39',
            source: 'NETOPS-MIG',
            description: 'Clinical subnet route verification succeeded',
            critical: false,
            status: 'pending'
        },
        {
            id: 'ALRT-012',
            severity: 'CRIT',
            timestamp: '07:17:02',
            source: 'SMB-AUDIT',
            description: 'Anomalous SMB write volume spike across DC shares',
            critical: true,
            status: 'pending'
        },
        {
            id: 'ALRT-013',
            severity: 'LOW',
            timestamp: '07:17:31',
            source: 'PATCH-ORCH',
            description: 'Planned update batch completed in enterprise zone',
            critical: false,
            status: 'pending'
        },
        {
            id: 'ALRT-014',
            severity: 'MED',
            timestamp: '07:17:57',
            source: 'ROUTER-EDGE',
            description: 'Perimeter route flap self-corrected',
            critical: false,
            status: 'pending'
        },
        {
            id: 'ALRT-015',
            severity: 'LOW',
            timestamp: '07:18:21',
            source: 'BKP-SCH-02',
            description: 'Backup retention policy check complete',
            critical: false,
            status: 'pending'
        },
        {
            id: 'ALRT-018',
            severity: 'CRIT',
            timestamp: '07:18:48',
            source: 'RDP-MON',
            description: 'Cross-zone RDP session from enterprise into clinical host',
            critical: true,
            status: 'pending'
        }
    ];
}

export class SiemDashboardMinigame extends MinigameScene {
    constructor(container, params = {}) {
        super(container, {
            ...params,
            title: 'SIEM Dashboard',
            showCancel: true,
            cancelText: 'Close Console'
        });

        this.timeLimitSec = Number(params.timeLimitSec) > 0 ? Number(params.timeLimitSec) : 180;
        this.remainingSec = this.timeLimitSec;
        // TODO: For better reusability, support an inline `alerts` array in scenarioData so
        // scenario authors can define alert sets in their own scenario.json.erb without touching
        // this file. The priority chain would be:
        //   params.alerts (inline array) → ALERT_SETS[params.alertConfig] (named registry) → createSeededAlerts()
        // Example scenarioData field: "alerts": [ { "id": "...", "severity": "CRIT", ... } ]
        const configuredSet = params.alertConfig && ALERT_SETS[params.alertConfig];
        this.alerts = configuredSet
            ? configuredSet.map((a) => ({ ...a }))
            : createSeededAlerts();
        this.alertTimelineSec = getLatestAlertSecond(this.alerts);
        this.finished = false;
        this.isFinalized = false;
        this.ransomwareFlooded = false;
        this._tickerId = null;
        this._eventSubs = [];
        this._scheduledAlertTimeouts = [];

        this.alertsListEl = null;
        this.queueListEl = null;
        this.queueCountEl = null;
        this.pendingCountEl = null;
        this.timerEl = null;
        this.systemClockEl = null;
        this.resultBannerEl = null;
        this.panelEl = null;
    }

    init() {
        super.init();

        if (this.headerElement) {
            this.headerElement.style.display = 'none';
        }

        this.container.classList.add('siem-minigame-container');
        this.gameContainer.classList.add('siem-minigame-game-container');

        this.restoreState();
        this.renderLayout();
        this.renderAll();
    }

    start() {
        super.start();

        this.startTickers();
        this.subscribeScenarioEvents();
    }

    complete(success) {
        if (!this.isFinalized) {
            this.persistState();
            if (window.MinigameFramework) {
                window.MinigameFramework.endMinigame(false, {
                    aborted: true,
                    minigameName: 'siem-dashboard'
                });
            }
            return;
        }

        super.complete(success);
    }

    cleanup() {
        if (this._tickerId) {
            clearInterval(this._tickerId);
            this._tickerId = null;
        }

        if (this._scheduledAlertTimeouts.length) {
            this._scheduledAlertTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
            this._scheduledAlertTimeouts = [];
        }

        this.unsubscribeScenarioEvents();
        super.cleanup();
    }

    nextAlertTimestamp(stepSec = 1) {
        const increment = Math.max(1, Math.floor(Number(stepSec) || 1));
        this.alertTimelineSec = (this.alertTimelineSec + increment) % 86400;
        return formatSecondsToClock(this.alertTimelineSec);
    }

    startTickers() {
        this.updateHeaderClock();
        this.updateStatusBar();

        this._tickerId = setInterval(() => {
            if (!this.finished) {
                this.remainingSec = Math.max(0, this.remainingSec - 1);
                this.updateStatusBar();

                // Passive alerts every 7-10 seconds (random)
                if (Math.random() < 0.15) {
                    this.injectPassiveAlert();
                }

                if (this.remainingSec === 0) {
                    this.finalizeOutcome();
                }
            }

            this.updateHeaderClock();
        }, 1000);
    }

    subscribeScenarioEvents() {
        if (!window.eventDispatcher) return;

        const newAlertHandler = (payload) => {
            this.handleInjectedAlert(payload);
        };

        const ransomwareHandler = (payload) => {
            if (payload?.value === true) {
                this.injectRansomwareCriticalFlood();
            }
        };

        window.eventDispatcher.on('siem_new_alert', newAlertHandler);
        window.eventDispatcher.on('global_variable_changed:ransomware_deployed', ransomwareHandler);

        this._eventSubs.push({ event: 'siem_new_alert', handler: newAlertHandler });
        this._eventSubs.push({ event: 'global_variable_changed:ransomware_deployed', handler: ransomwareHandler });
    }

    unsubscribeScenarioEvents() {
        if (!window.eventDispatcher || !this._eventSubs.length) return;

        this._eventSubs.forEach((sub) => {
            window.eventDispatcher.off(sub.event, sub.handler);
        });

        this._eventSubs = [];
    }

    renderLayout() {
        this.gameContainer.innerHTML = `
            <div class="siem-panel" id="siem-panel">
                <div class="siem-result-banner" id="siem-result-banner"></div>
                <div class="siem-header">
                    <div class="siem-title">NORTHGATE TRUST // SIEM CONSOLE</div>
                    <div class="siem-clock" id="siem-system-clock">00:00:00</div>
                </div>
                <div class="siem-body">
                    <div class="siem-alert-pane">
                        <div class="siem-pane-title">ALERT STREAM</div>
                        <div class="siem-alert-list" id="siem-alert-list"></div>
                    </div>
                    <div class="siem-queue-pane">
                        <div class="siem-pane-title">ESCALATED FOR REVIEW</div>
                        <div class="siem-queue-count" id="siem-queue-count">0 alerts queued</div>
                        <div class="siem-queue-list" id="siem-queue-list"></div>
                    </div>
                </div>
                <div class="siem-status-bar">
                    <span id="siem-pending-count">ALERTS PENDING: 0</span>
                    <span id="siem-time-remaining">TIME REMAINING: 00:00</span>
                </div>
            </div>
        `;

        this.panelEl = this.gameContainer.querySelector('#siem-panel');
        this.alertsListEl = this.gameContainer.querySelector('#siem-alert-list');
        this.queueListEl = this.gameContainer.querySelector('#siem-queue-list');
        this.queueCountEl = this.gameContainer.querySelector('#siem-queue-count');
        this.pendingCountEl = this.gameContainer.querySelector('#siem-pending-count');
        this.timerEl = this.gameContainer.querySelector('#siem-time-remaining');
        this.systemClockEl = this.gameContainer.querySelector('#siem-system-clock');
        this.resultBannerEl = this.gameContainer.querySelector('#siem-result-banner');
    }

    renderAll() {
        this.renderAlerts();
        this.renderQueue();
        this.updateStatusBar();
    }

    renderAlerts() {
        if (!this.alertsListEl) return;

        const previousScrollTop = this.alertsListEl.scrollTop;
        this.alertsListEl.innerHTML = '';

        this.alerts.forEach((alert) => {
            const row = document.createElement('div');
            row.className = `siem-alert-row status-${alert.status}`;
            row.dataset.alertId = alert.id;

            const severity = document.createElement('span');
            severity.className = `siem-severity sev-${alert.severity}`;
            severity.textContent = alert.severity;

            const time = document.createElement('span');
            time.className = 'siem-time';
            time.textContent = alert.timestamp;

            const source = document.createElement('span');
            source.className = 'siem-source';
            source.textContent = displayDashes(alert.source);

            const description = document.createElement('span');
            description.className = 'siem-description';
            description.textContent = displayDashes(alert.description);

            const actions = document.createElement('span');
            actions.className = 'siem-actions';

            const dismissBtn = document.createElement('button');
            dismissBtn.className = 'siem-btn dismiss';
            dismissBtn.textContent = 'DISMISS';
            dismissBtn.disabled = alert.status !== 'pending' || this.finished;
            dismissBtn.addEventListener('click', () => this.handleAction(alert.id, 'dismissed'));

            const escalateBtn = document.createElement('button');
            escalateBtn.className = 'siem-btn escalate';
            escalateBtn.textContent = 'ESCALATE';
            escalateBtn.disabled = alert.status !== 'pending' || this.finished;
            escalateBtn.addEventListener('click', () => this.handleAction(alert.id, 'escalated'));

            const undoBtn = document.createElement('button');
            undoBtn.className = 'siem-btn dismiss';
            undoBtn.textContent = 'UNDO';
            undoBtn.disabled = alert.status !== 'dismissed' || this.finished;
            undoBtn.addEventListener('click', () => this.handleAction(alert.id, 'pending'));

            // Show dismiss/escalate buttons for pending alerts, undo button for dismissed alerts
            if (alert.status === 'pending') {
                actions.appendChild(dismissBtn);
                actions.appendChild(escalateBtn);
            } else if (alert.status === 'dismissed') {
                actions.appendChild(undoBtn);
            } else if (alert.status === 'escalated') {
                // Escalated alerts show no buttons
            }

            row.appendChild(severity);
            row.appendChild(time);
            row.appendChild(source);
            row.appendChild(description);
            row.appendChild(actions);

            this.alertsListEl.appendChild(row);
        });

        this.alertsListEl.scrollTop = previousScrollTop;
    }

    renderQueue() {
        if (!this.queueListEl || !this.queueCountEl) return;

        const escalated = this.alerts
            .filter((alert) => alert.status === 'escalated')
            .sort((a, b) => {
                const sevDelta = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
                if (sevDelta !== 0) return sevDelta;
                return a.timestamp.localeCompare(b.timestamp);
            });

        this.queueListEl.innerHTML = '';

        escalated.forEach((alert) => {
            const item = document.createElement('div');
            item.className = 'siem-queue-item';
            item.innerHTML = `
                <span class="siem-queue-sev sev-${alert.severity}">${alert.severity}</span>
                <span class="siem-queue-text">${displayDashes(alert.source)} - ${displayDashes(alert.description)}</span>
            `;
            this.queueListEl.appendChild(item);
        });

        // Add severity breakdown section
        const breakdownSection = document.createElement('div');
        breakdownSection.className = 'siem-queue-section-title';
        breakdownSection.textContent = '▸ SEVERITY BREAKDOWN';
        
        const severityChart = this.renderSeverityChart();
        const severityLegend = this.renderSeverityLegend();
        
        // Add alert score section
        const scoreSection = document.createElement('div');
        scoreSection.className = 'siem-queue-section-title';
        scoreSection.textContent = '▸ ALERTS SCORE';
        
        const scoreBox = document.createElement('div');
        scoreBox.className = 'siem-alert-score-box';
        scoreBox.innerHTML = `
            <span class="siem-alert-score-label">TRIAGE SCORE</span>
            <span class="siem-alert-score-value">${this.calculateAlertScore()}</span>
        `;

        // Append all to queue list
        this.queueListEl.appendChild(breakdownSection);
        this.queueListEl.appendChild(severityChart);
        this.queueListEl.appendChild(severityLegend);
        this.queueListEl.appendChild(scoreSection);
        this.queueListEl.appendChild(scoreBox);

        // Add top sources section
        const sourcesSection = document.createElement('div');
        sourcesSection.className = 'siem-queue-section-title';
        sourcesSection.textContent = '▸ TOP SOURCES';

        const sourcesBox = this.renderTopSources();

        this.queueListEl.appendChild(sourcesSection);
        this.queueListEl.appendChild(sourcesBox);

        this.queueCountEl.textContent = `${escalated.length} alerts queued`;
    }

    renderSeverityChart() {
        const chartBox = document.createElement('div');
        chartBox.className = 'siem-severity-chart';

        const severities = ['LOW', 'MED', 'HIGH', 'CRIT'];
        const total = Math.max(1, this.alerts.length);
        
        severities.forEach(sev => {
            const count = this.alerts.filter(a => a.severity === sev).length;
            const percentage = (count / total) * 100;
            const bar = document.createElement('div');
            bar.className = `siem-severity-bar sev-${sev}`;
            bar.style.flex = Math.max(percentage, 1) || 0.1;
            chartBox.appendChild(bar);
        });

        return chartBox;
    }

    renderSeverityLegend() {
        const legend = document.createElement('div');
        legend.className = 'siem-severity-legend';

        const severities = ['CRIT', 'HIGH', 'MED', 'LOW'];
        severities.forEach(sev => {
            const count = this.alerts.filter(a => a.severity === sev).length;
            const item = document.createElement('div');
            item.className = 'siem-severity-item';
            item.innerHTML = `
                <span class="siem-severity-item-color sev-${sev}"></span>
                <span>${sev}</span>
                <span class="siem-severity-item-count">${count}</span>
            `;
            legend.appendChild(item);
        });

        return legend;
    }

    calculateAlertScore() {
        // Score based on escalated critical alerts vs total critical alerts
        const critical = this.alerts.filter(a => a.critical);
        const criticalEscalated = critical.filter(a => a.status === 'escalated').length;
        
        if (critical.length === 0) return '0';
        
        const percentage = Math.floor((criticalEscalated / critical.length) * 100);
        return `${percentage}%`;
    }

    renderTopSources() {
        const box = document.createElement('div');
        box.className = 'siem-sources-box';

        // Count alerts by source
        const sourceCounts = {};
        this.alerts.forEach(alert => {
            sourceCounts[alert.source] = (sourceCounts[alert.source] || 0) + 1;
        });

        // Get top 5 sources sorted by count
        const topSources = Object.entries(sourceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (topSources.length === 0) {
            box.innerHTML = '<div class="siem-sources-empty">No sources yet</div>';
            return box;
        }

        const maxCount = Math.max(...topSources.map(s => s[1]));

        const list = document.createElement('div');
        list.className = 'siem-sources-list';

        topSources.forEach(([source, count]) => {
            const row = document.createElement('div');
            row.className = 'siem-source-row';

            const name = document.createElement('span');
            name.className = 'siem-source-name';
            name.textContent = displayDashes(source);

            const barContainer = document.createElement('div');
            barContainer.className = 'siem-source-bar-container';

            const bar = document.createElement('div');
            bar.className = 'siem-source-bar';
            const barWidth = (count / maxCount) * 100;
            bar.style.width = `${barWidth}%`;

            barContainer.appendChild(bar);

            const countSpan = document.createElement('span');
            countSpan.className = 'siem-source-count';
            countSpan.textContent = count.toString();

            row.appendChild(name);
            row.appendChild(barContainer);
            row.appendChild(countSpan);
            list.appendChild(row);
        });

        box.appendChild(list);
        return box;
    }

    updateStatusBar() {
        if (this.pendingCountEl) {
            const pending = this.alerts.filter((alert) => alert.status === 'pending').length;
            this.pendingCountEl.textContent = `ALERTS PENDING: ${pending}`;
        }

        if (this.timerEl) {
            this.timerEl.textContent = `TIME REMAINING: ${formatTimer(this.remainingSec)}`;
        }
    }

    updateHeaderClock() {
        if (this.systemClockEl) {
            this.systemClockEl.textContent = formatClock(new Date());
        }
    }

    handleAction(alertId, newStatus) {
        if (this.finished) return;

        const alert = this.alerts.find((entry) => entry.id === alertId);
        if (!alert) return;

        // Allow status changes:
        // pending → dismissed, pending → escalated
        // dismissed → pending (undo dismiss), escalated stays escalated
        if (alert.status === 'escalated') return; // Can't change escalated status
        if (alert.status !== 'pending' && newStatus !== 'pending') return; // Can only go back to pending

        const wasCritical = alert.critical;
        const wasStatusDismissed = alert.status === 'dismissed';
        alert.status = newStatus;

        // If a critical alert is dismissed, mark that alerts were missed
        if (wasCritical && newStatus === 'dismissed') {
            this.setScenarioGlobal('siem_missed_alerts', true);
        }

        // If an alert is undone, check if we should clear the missed_alerts flag
        // (only if no critical alerts remain dismissed)
        if (wasCritical && wasStatusDismissed && newStatus === 'pending') {
            const anyCriticalDismissed = this.alerts
                .filter((entry) => entry.critical)
                .some((entry) => entry.status === 'dismissed');
            if (!anyCriticalDismissed) {
                this.setScenarioGlobal('siem_missed_alerts', false);
            }
        }

        this.renderAll();
        this.persistState();

        // Check if all critical alerts are now handled (escalated only)
        const allCriticalEscalated = this.alerts
            .filter((entry) => entry.critical)
            .every((entry) => entry.status === 'escalated');

        if (allCriticalEscalated && this.alerts.filter((entry) => entry.critical).length > 0) {
            this.finalizeOutcome();
        }
    }

    injectPassiveAlert() {
        if (this.finished) return;

        // Passive alerts: mostly LOW and MED severity, occasionally HIGH
        const passiveAlertPool = [
            { severity: 'LOW', source: 'NETMON', description: 'Routine DNS query volume pattern detected' },
            { severity: 'LOW', source: 'FW-LOG', description: 'Blocked port scan from external range' },
            { severity: 'LOW', source: 'SYSLOG', description: 'User session timeout on workstation' },
            { severity: 'MED', source: 'IDS-CORE', description: 'Unusual traffic pattern on port 445' },
            { severity: 'MED', source: 'PKI', description: 'Certificate authority audit log rotation' },
            { severity: 'MED', source: 'VPN-GW', description: 'VPN session disconnected abnormally' },
            { severity: 'HIGH', source: 'AUTH-SRV', description: 'Failed authentication attempts threshold' },
            { severity: 'LOW', source: 'DHCP', description: 'DHCP lease renewal processed' },
            { severity: 'LOW', source: 'DNS-PIX', description: 'Known malware domain access blocked' },
            { severity: 'MED', source: 'PROXY', description: 'SSL/TLS certificate validation warning' }
        ];

        const randomAlert = passiveAlertPool[Math.floor(Math.random() * passiveAlertPool.length)];
        this.handleInjectedAlert(randomAlert);
    }

    handleInjectedAlert(payload = {}) {
        if (this.finished) return;

        const severity = normalizeSeverity(payload.severity);
        const stepSec = Number(payload.stepSec) > 0 ? Number(payload.stepSec) : 1;
        const alert = {
            id: payload.id || `ALRT-EXT-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
            severity,
            timestamp: this.nextAlertTimestamp(stepSec),
            source: payload.source || 'SIEM-CORE',
            description: payload.description || 'External alert injected into SIEM stream',
            critical: severity === 'CRIT',
            status: 'pending'
        };

        // Keep the player's visible alert rows stable while new alerts are prepended.
        const previousScrollTop = this.alertsListEl ? this.alertsListEl.scrollTop : 0;
        const previousScrollHeight = this.alertsListEl ? this.alertsListEl.scrollHeight : 0;

        this.alerts.unshift(alert);
        this.renderAll();

        if (this.alertsListEl) {
            const scrollDelta = Math.max(0, this.alertsListEl.scrollHeight - previousScrollHeight);
            this.alertsListEl.scrollTop = previousScrollTop + scrollDelta;
        }

        this.persistState();
    }

    injectRansomwareCriticalFlood() {
        if (this.ransomwareFlooded || this.finished) return;

        this.ransomwareFlooded = true;
        if (this.panelEl) {
            this.panelEl.classList.add('ransomware-pulse');
        }

        const ransomwareSequence = [
            {
                severity: 'CRIT',
                source: 'EHR-CORE',
                description: 'Ransomware encryption behavior detected in clinical data plane'
            },
            {
                severity: 'MED',
                source: 'BKP-SCH-02',
                description: 'Backup verification jobs failing across multiple nodes'
            },
            {
                severity: 'CRIT',
                source: 'AD-MONITOR',
                description: 'Mass credential abuse and privilege escalation chain observed'
            },
            {
                severity: 'HIGH',
                source: 'FILE-SRV-02',
                description: 'Rapid rename operations with encrypted extension patterns'
            },
            {
                severity: 'CRIT',
                source: 'FW-CORE',
                description: 'Lateral movement burst crossing enterprise and clinical segments'
            },
            {
                severity: 'LOW',
                source: 'NETMON',
                description: 'Unusual heartbeat jitter observed on monitoring collectors'
            },
            {
                severity: 'HIGH',
                source: 'IAM-SVC',
                description: 'Service account token misuse detected in domain operations'
            },
            {
                severity: 'CRIT',
                source: 'SMB-AUDIT',
                description: 'Emergency threshold exceeded for encrypted SMB write operations'
            }
        ];

        // Spread burst over 10-20 seconds with mixed severities between critical hits.
        const durationSec = 10 + Math.floor(Math.random() * 11);
        const slotGapSec = durationSec / Math.max(1, ransomwareSequence.length - 1);

        ransomwareSequence.forEach((entry, index) => {
            const delayMs = Math.round(slotGapSec * index * 1000);
            const timeoutId = setTimeout(() => {
                if (this.finished) return;
                this.handleInjectedAlert({
                    ...entry,
                    stepSec: Math.max(1, Math.round(slotGapSec))
                });
            }, delayMs);
            this._scheduledAlertTimeouts.push(timeoutId);
        });
    }

    finalizeOutcome() {
        if (this.finished) return;

        this.finished = true;

        const criticalAlerts = this.alerts.filter((entry) => entry.critical);
        const criticalEscalated = criticalAlerts.filter((entry) => entry.status === 'escalated').length;
        const success = criticalEscalated === criticalAlerts.length && criticalAlerts.length > 0;

        this.isFinalized = true;

        if (success) {
            this.setScenarioGlobal('siem_escalated', true);
            this.setScenarioGlobal('siem_missed_alerts', false);
            this.showResultBanner('INCIDENT TEAM NOTIFIED', true);
        } else {
            this.setScenarioGlobal('siem_escalated', false);
            this.setScenarioGlobal('siem_missed_alerts', true);
            this.showResultBanner('CRITICAL ALERTS MISSED - INCIDENT ESCALATED', false);
        }

        this.gameResult = {
            success,
            escalated: this.alerts.filter((entry) => entry.status === 'escalated').map((entry) => entry.id),
            dismissed: this.alerts.filter((entry) => entry.status === 'dismissed').map((entry) => entry.id),
            missedCritical: criticalAlerts.filter((entry) => entry.status !== 'escalated').map((entry) => entry.id)
        };

        if (window.eventDispatcher) {
            window.eventDispatcher.emit('siem_triage_completed', this.gameResult);
        }

        this.clearState();
        this.renderAll();

        setTimeout(() => {
            super.complete(success);
        }, 1300);
    }

    showResultBanner(message, success) {
        if (!this.resultBannerEl) return;

        this.resultBannerEl.textContent = displayDashes(message);
        this.resultBannerEl.classList.remove('success', 'failure', 'show');
        this.resultBannerEl.classList.add(success ? 'success' : 'failure');

        requestAnimationFrame(() => {
            this.resultBannerEl.classList.add('show');
        });
    }

    setScenarioGlobal(name, value) {
        if (window.npcManager?.setGlobalVariable) {
            window.npcManager.setGlobalVariable(name, value);
            return;
        }

        if (!window.gameState) {
            window.gameState = {};
        }
        if (!window.gameState.globalVariables) {
            window.gameState.globalVariables = {};
        }

        const oldValue = window.gameState.globalVariables[name];
        window.gameState.globalVariables[name] = value;

        if (window.eventDispatcher) {
            window.eventDispatcher.emit(`global_variable_changed:${name}`, {
                name,
                value,
                oldValue
            });
        }
    }

    persistState() {
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.globalVariables) window.gameState.globalVariables = {};

        window.gameState.globalVariables[STATE_KEY] = {
            remainingSec: this.remainingSec,
            alerts: this.alerts.map((entry) => ({
                id: entry.id,
                severity: entry.severity,
                timestamp: entry.timestamp,
                source: entry.source,
                description: entry.description,
                critical: entry.critical,
                status: entry.status
            })),
            ransomwareFlooded: this.ransomwareFlooded
        };
    }

    restoreState() {
        const persisted = window.gameState?.globalVariables?.[STATE_KEY];
        if (!persisted) return;

        if (Array.isArray(persisted.alerts) && persisted.alerts.length > 0) {
            this.alerts = persisted.alerts.map((entry) => ({
                ...entry,
                severity: normalizeSeverity(entry.severity),
                status: entry.status || 'pending',
                critical: entry.critical === true
            }));
        }

        this.alertTimelineSec = getLatestAlertSecond(this.alerts);

        if (typeof persisted.remainingSec === 'number') {
            this.remainingSec = Math.max(0, Math.floor(persisted.remainingSec));
        }

        this.ransomwareFlooded = persisted.ransomwareFlooded === true;
    }

    clearState() {
        if (window.gameState?.globalVariables) {
            delete window.gameState.globalVariables[STATE_KEY];
        }
    }
}
