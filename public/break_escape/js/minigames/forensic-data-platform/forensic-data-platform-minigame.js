import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

/**
 * MG-02 — Forensic Data Platform
 *
 * Tab content is keyed by `params.tabSet` and stored in TAB_SETS below,
 * following the same pattern as the SIEM ALERT_SETS. Each tab defines a
 * `blocks` array of typed content objects rendered by generic functions —
 * no scenario-specific render functions required.
 *
 * Block types: p, timeline, log-table, setpoint-table, document-excerpt, list, callout
 * Callout styles: evidence-gap, session-record, compliance-note
 * Conditional blocks: add `showIf: 'globalVarName'` to any block
 *
 * Required params:
 *   tabSet           — key into TAB_SETS (e.g. "albion_sis03")
 *   title            — header left text
 *   caseRef          — header right text (case reference)
 *   reviewedVar      — global var written on first open
 *   confirmedVar     — global var written on causal chain confirm
 *   confirmGateTab   — tab id that must be visited before confirm is enabled
 *   confirmLabel     — confirm button text
 *   confirmHint      — hint shown while gate not met
 *   confirmReadyHint — hint shown when gate is met
 *   confirmSuccessText — text shown after confirming
 */

// ── Tab set registry ───────────────────────────────────────────────────────────
// Add new scenario tab sets here. Each tab's `blocks` array is rendered by the
// generic renderers below — no scenario-specific functions needed.

const TAB_SETS = {
    albion_sis03: {
        tabs: [
            {
                id:      'timeline',
                label:   'ATTACK TIMELINE',
                heading: 'Attack Timeline — Albion Energy Storage Incident',
                blocks: [
                    {
                        type: 'timeline',
                        steps: [
                            { label: 'Weeks 1–4 — Initial Access (Ferryman IAB)',    desc: 'Multi-function printer firmware supply-chain compromise. Periodic HTTPS beaconing to C2 infrastructure confirmed via firewall logs. Ferryman Collective assessed as financially motivated initial access broker.' },
                            { label: 'Weeks 5–6 — Handoff to GREYMANTLE APT',       desc: 'Dormant contractor account <strong>c.ellison</strong> activated via RDP from 185.220.101.47 (Romania). Account not deprovisioned 14 months post-departure. Session terminates at HMI-ENG-02 engineering workstation.' },
                            { label: 'T−7 days — Domain Persistence',               desc: 'Service DLL implant on Domain Controller. DNS-over-HTTPS C2 communications. Active Directory lateral movement credentials created for SCADA zone access.' },
                            { label: 'T−2 days, 23:12 — Sensor Data Falsification', desc: 'Historian records show Rack A1–A4 temperature readings replaced with flat 28.0°C values (actual: elevated). Flat-line begins simultaneously across all four racks — impossible in natural operation.' },
                            { label: 'T−1 day, 03:22 — SIS Setpoint Manipulation',  desc: 'SIS engineering port accessed via HMI-ENG-02. Thermal runaway threshold raised: 55°C → 85°C. H₂ alarm threshold raised: 1.0% → 3.8% LEL. Voltage trip setpoint modified. Automated safety barriers silently disabled.' },
                            { label: 'T+0, 06:28 — Anomaly Detected',                   desc: 'On-site engineer identifies thermometer discrepancy: analog reads 51°C; SCADA reports 28°C. Emergency Shutdown (ESD) activated. Racks A1–A4 isolated. Facility evacuated.' },
                            { label: '⚠ Evidence Gap', warn: true,                       desc: 'PLC-BMS holding registers containing falsified sensor values were overwritten by the ESD shutdown sequence. SIS engineering protocol did not log modification commands. Causal link established by reconstruction, not direct log evidence.' },
                        ]
                    },
                    {
                        type:  'callout',
                        style: 'evidence-gap',
                        title: '⚠ Critical Evidence Gap — See SIS Engineering Log Tab',
                        body:  '<p>The safety action that prevented thermal runaway (pressing ESD) is also the action that destroyed key forensic evidence. Safety restoration and evidence preservation were in direct conflict. See Policy Section 7.1 (Cooperation Clause) and CLAIM-INS-006.</p>',
                    },
                ]
            },
            {
                id:      'jump_log',
                label:   'JUMP SERVER LOG',
                heading: 'Jump Server Access Log — JS-ALBION-01',
                blocks: [
                    { type: 'p', html: 'Session log recovered intact from jump server. Marcus Webb reviewed this remotely during the incident response.' },
                    {
                        type:    'log-table',
                        columns: ['Timestamp', 'User', 'Source IP', 'Duration', 'Activity'],
                        rows: [
                            { cells: ['Mar 14, 08:22', 'm.harris',             '10.1.0.45 (internal)',                              '1h 12m',              'Routine engineering access'] },
                            { cells: ['Mar 15, 14:05', 'j.patel',              '10.1.0.23 (internal)',                              '0h 47m',              'Historian configuration review'] },
                            { cells: ['Mar 16, 22:31', 'm.harris',             '10.1.0.45 (internal)',                              '0h 28m',              'Out-of-hours check — normal'] },
                            { cells: ['Mar 17, 01:47', '<strong>c.ellison</strong>', '<strong>185.220.101.47</strong> (Tor exit node — Romania)', '<strong>4h 41m+ (active)</strong>', 'RDP to HMI-ENG-02; lateral movement commands; SIS engineering port access at 03:22'], highlight: true },
                        ]
                    },
                    {
                        type:  'callout',
                        style: 'compliance-note',
                        body:  '<strong>WARRANTY W-09 STATUS: BREACHED</strong><br>Account c.ellison: contract terminated 14 months prior to this session. Account was not deprovisioned. Default credentials retained. This dormant account was the primary attack pivot point into the OT environment.',
                    },
                ]
            },
            {
                id:      'historian',
                label:   'HISTORIAN DATA',
                heading: 'Historian Data Integrity Report',
                blocks: [
                    { type: 'p', html: 'The SCADA process historian faithfully recorded the falsified sensor values that were injected into the BMS PLC. The falsification is detectable via statistical analysis of variance.' },
                    {
                        type:    'log-table',
                        columns: ['Rack', 'Reading at 23:11', 'Reading at 23:13', 'Pre-23:12 Variance', 'Post-23:12 Variance'],
                        rows: [
                            { cells: ['A1', '31.4°C', '28.0°C (flat)', { html: '&plusmn;2.1&deg;C', class: 'fdp-row-highlight' }, '<strong style="color:#f85149">0.00°C</strong>'] },
                            { cells: ['A2', '30.8°C', '28.0°C (flat)', '&plusmn;1.9&deg;C',                                        '<strong style="color:#f85149">0.00°C</strong>'] },
                            { cells: ['A3', '31.1°C', '28.0°C (flat)', '&plusmn;2.3&deg;C',                                        '<strong style="color:#f85149">0.00°C</strong>'] },
                            { cells: ['A4', '30.9°C', '28.0°C (flat)', '&plusmn;2.0&deg;C',                                        '<strong style="color:#f85149">0.00°C</strong>'] },
                        ]
                    },
                    {
                        type:  'callout',
                        style: 'evidence-gap',
                        title: '⚠ Forensic Finding',
                        body:  '<p>Flat-line at exactly 28.0°C across all four racks simultaneously from 23:12. Zero variance across four independent thermal sensors is physically impossible under any normal operating condition. Confirms sensor data injection. The historian recorded the falsified values — it cannot distinguish falsified from real data.</p>',
                    },
                    {
                        type:   'callout',
                        style:  'session-record',
                        title:  '⚡ SIS02 Session Record — Case 2 Continuity',
                        body:   '<p>Historian flat-line anomaly confirmed by Case 2 investigation team. On-site review of Rack A1–A4 historian trend data at 23:12 timestamp independently verified by player team in the Albion Energy scenario.</p>',
                        showIf: 'historian_flatline_found',
                    },
                ]
            },
            {
                id:      'sis_log',
                label:   'SIS ENGINEERING LOG',
                heading: 'SIS Engineering Log — Post-Incident Physical Inspection',
                blocks: [
                    { type: 'p', html: 'The SIS safety PLC was physically inspected after the incident. No engineering log exists — the SIS protocol does not record modification commands.' },
                    {
                        type: 'setpoint-table',
                        rows: [
                            { label: 'THERMAL_RUNAWAY_THRESHOLD', value: '55°C → <strong>85°C</strong> [MODIFIED]' },
                            { label: 'H₂_ALARM_THRESHOLD',   value: '1.0% LEL → <strong>3.8% LEL</strong> [MODIFIED]' },
                            { label: 'VOLTAGE_TRIP_SETPOINT',    value: '<strong>Modified</strong> [value reset by ESD]' },
                            { label: 'Firmware version',          value: '<strong>2.4.1</strong> (patch available 18 months — not applied)' },
                        ]
                    },
                    {
                        type:  'callout',
                        style: 'evidence-gap',
                        title: '⚠ Critical Evidence Gap — No Modification Log',
                        body:  '<p>The SIS engineering protocol does not log modification commands. There is no forensic record of when the setpoints were changed, from which network address the commands originated, or which user authenticated to the engineering port. The causal link to the c.ellison RDP session is established by circumstantial reconstruction: session active 01:47–06:09; setpoint modification discovered during post-incident inspection at 03:22 timestamp — inferred, not logged.</p><p style="margin-top:6px">This gap also complicates the cooperation clause assessment (Policy Section 7.1): Albion could not have preserved what the SIS never recorded.</p>',
                    },
                    {
                        type:   'callout',
                        style:  'session-record',
                        title:  '⚡ SIS02 Session Record — Case 2 Continuity',
                        body:   '<p>SIS setpoint tampering confirmed by Case 2 investigation team. THERMAL_RUNAWAY_THRESHOLD modification verified via SIS configuration panel in the Albion Energy scenario. Players independently identified the tampered values against the IEC 61511 certified baseline.</p>',
                        showIf: 'sis_tamper_confirmed',
                    },
                ]
            },
            {
                id:      'dc_implant',
                label:   'DOMAIN IMPLANT',
                heading: 'Domain Controller Implant Chain',
                blocks: [
                    { type: 'p', html: 'Progressive privilege escalation from initial printer access to full SCADA network reach. Five distinct stages across the Albion enterprise IT environment.' },
                    {
                        type: 'timeline',
                        steps: [
                            { label: 'Step 1 — Printer Firmware Compromise',          desc: 'Ferryman Collective supply-chain technique. Malicious firmware pushed to shared multi-function printer. Provides persistent foothold on corporate VLAN without triggering EDR.' },
                            { label: 'Step 2 — C2 Beacon Establishment',              desc: 'HTTPS beaconing to attacker C2 infrastructure. Confirmed via firewall egress logs — periodic small HTTPS requests to domains registered within prior 30 days. Technique: DNS-over-HTTPS for C2 channel (bypasses DNS-layer monitoring).' },
                            { label: 'Step 3 — Domain Admin Credential Harvest',      desc: 'Lateral movement from printer VLAN to corporate VLAN. DCSync technique used against Domain Controller to extract NTLM hashes for privileged accounts. Enterprise IT credentials fully compromised.' },
                            { label: 'Step 4 — Domain Controller Service DLL Implant', desc: 'Persistence implant: malicious service DLL loaded on Domain Controller. Survives reboots. Provides reliable re-entry even if C2 beacon is disrupted. Specific DLL matches known GREYMANTLE tooling (NCSC attribution basis).' },
                            { label: 'Step 5 — Jump Server Pivot via Dormant Account', desc: 'Dormant contractor RDP credentials (c.ellison) used to authenticate to jump server from Tor exit node. Bidirectional RDP configuration enables forward pivot to HMI-ENG-02 on the SCADA network. CastleTech SOC contract explicitly excluded jump server session log monitoring — blind spot.' },
                        ]
                    },
                    {
                        type:  'callout',
                        style: 'compliance-note',
                        body:  '<strong>CLAIM-INS-001 (IT/OT Boundary):</strong> The jump server bidirectional RDP configuration and dual-homed historian provided two independent IT-to-OT pivot paths. Both were known deficiencies at policy inception. Both remained unremediated at incident date.',
                    },
                ]
            },
            {
                id:      'soc_coverage',
                label:   'SOC COVERAGE REPORT',
                heading: 'CastleTech SOC Coverage Report',
                blocks: [
                    { type: 'p', html: 'Excerpt from CastleTech Solutions engagement scope documentation, as held in Albion\'s vendor management records and confirmed by CastleTech account manager during forensic interview.' },
                    {
                        type:   'document-excerpt',
                        body:   '&ldquo;CastleTech Solutions SOC Engagement &mdash; Scope Clarification (January 2024): Monitoring scope is limited to enterprise IT systems on the corporate VLAN, including email, ERP, endpoint devices, and corporate firewall. <strong>Operational technology systems, including the SCADA network, ICS field devices, the jump server session logs, engineering workstations, and historian server OT interface, fall outside the scope of this engagement.</strong> Any monitoring of OT environments would require a separate SOC-OT service agreement and additional on-site sensor deployment. CastleTech does not currently offer this service to Albion.&rdquo;',
                        source: 'Source: CastleTech Scope Clarification Letter, January 2024 — ref CCL-ALBE-2024-01',
                    },
                    { type: 'p', html: 'This exclusion means CastleTech had no visibility of:' },
                    {
                        type:  'list',
                        items: [
                            'The c.ellison RDP session on the jump server',
                            'Lateral movement commands on HMI-ENG-02',
                            'The historian sensor data falsification at 23:12',
                            'SIS engineering port access at 03:22',
                        ]
                    },
                    {
                        type:  'callout',
                        style: 'compliance-note',
                        body:  '<strong>WARRANTY W-12 STATUS: BREACHED</strong><br>Albion\'s MSP (CastleTech) explicitly excluded OT systems from monitoring scope. Warranty W-12 required managed service providers to maintain equivalent security coverage across the insured environment. The OT exclusion created the monitoring blind spot that allowed the attack to progress undetected for weeks.',
                    },
                    {
                        type:  'callout',
                        style: 'compliance-note',
                        body:  '<strong>WARRANTY W-09 (Access Control) — supporting evidence:</strong><br>The CastleTech SOC monitored Active Directory but did not flag the c.ellison account as anomalous because it was outside OT scope. The IT-side AD logs show the account was enabled — deprovisioning failure is an Albion IT governance failure, not a CastleTech failure, but the SOC monitoring gap meant no compensating detection existed.',
                        style2: 'margin-top:10px',
                    },
                ]
            },
        ]
    }
};

// ── Generic block renderers ────────────────────────────────────────────────────

function _renderTimeline(steps) {
    let n = 0;
    const items = steps.map(s => {
        const num = s.warn ? '!' : ++n;
        const cls = s.warn ? ' fdp-timeline-num-warn' : '';
        return `
<li class="fdp-timeline-step">
  <div class="fdp-timeline-num${cls}">${num}</div>
  <div class="fdp-timeline-body">
    <div class="fdp-timeline-label">${displayDashes(s.label)}</div>
    <div class="fdp-timeline-desc">${displayDashes(s.desc)}</div>
  </div>
</li>`;
    }).join('');
    return `<ul class="fdp-timeline">${items}</ul>`;
}

function _renderLogTable(block) {
    const headers = block.columns.map(c => `<th>${displayDashes(c)}</th>`).join('');
    const rows = block.rows.map(r => {
        const rowCls = r.highlight ? ' class="fdp-row-highlight"' : '';
        const cells  = r.cells.map(c => {
            if (c && typeof c === 'object') return `<td class="${c.class || ''}">${displayDashes(c.html)}</td>`;
            return `<td>${displayDashes(c)}</td>`;
        }).join('');
        return `<tr${rowCls}>${cells}</tr>`;
    }).join('');
    return `<table class="fdp-log-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

function _renderSetpointTable(block) {
    const rows = block.rows.map(r => `<tr><td>${displayDashes(r.label)}</td><td>${displayDashes(r.value)}</td></tr>`).join('');
    return `<table class="fdp-setpoint-table"><tbody>${rows}</tbody></table>`;
}

function _renderDocumentExcerpt(block) {
    return `<div class="fdp-doc-excerpt">${displayDashes(block.body)}<div class="fdp-doc-source">${displayDashes(block.source)}</div></div>`;
}

function _renderList(block) {
    const items = block.items.map(i => `<li>${displayDashes(i)}</li>`).join('');
    return `<ul style="margin:6px 0 10px 18px; font-size:11px; color:#c9d1d9; line-height:1.7">${items}</ul>`;
}

function _renderCallout(block) {
    const CSS_CLASS = {
        'evidence-gap':    'fdp-evidence-gap',
        'session-record':  'fdp-session-record',
        'compliance-note': 'fdp-compliance-note',
    };
    const TITLE_CLASS = {
        'evidence-gap':   'fdp-evidence-gap-title',
        'session-record': 'fdp-session-record-title',
    };
    const cls       = CSS_CLASS[block.style] || 'fdp-evidence-gap';
    const titleCls  = TITLE_CLASS[block.style];
    const titleHtml = (block.title && titleCls) ? `<div class="${titleCls}">${displayDashes(block.title)}</div>` : '';
    const extraStyle = block.style2 ? ` style="${block.style2}"` : '';
    return `<div class="${cls}"${extraStyle}>${titleHtml}${displayDashes(block.body)}</div>`;
}

function _renderBlocks(blocks, globals) {
    return blocks.map(block => {
        if (block.showIf && !globals[block.showIf]) return '';
        switch (block.type) {
            case 'p':                return `<p>${displayDashes(block.html)}</p>`;
            case 'timeline':        return _renderTimeline(block.steps);
            case 'log-table':       return _renderLogTable(block);
            case 'setpoint-table':  return _renderSetpointTable(block);
            case 'document-excerpt': return _renderDocumentExcerpt(block);
            case 'list':            return _renderList(block);
            case 'callout':         return _renderCallout(block);
            default:                return '';
        }
    }).join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────

export class ForensicDataPlatformMinigame extends MinigameScene {
    constructor(container, params = {}) {
        super(container, {
            ...params,
            showCancel: true,
            cancelText: params.cancelText || 'Close Terminal'
        });
        this._tabsSeen  = new Set();
        this._confirmed = false;

        const tabSetKey = params.tabSet;
        if (tabSetKey && !TAB_SETS[tabSetKey]) {
            console.warn(`[FDP] Unknown tabSet "${tabSetKey}" — no tabs will render.`);
        }
        this._tabs = tabSetKey ? (TAB_SETS[tabSetKey]?.tabs || []) : [];
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';
        this.container.classList.add('fdp-minigame-container');
        this.gameContainer.classList.add('fdp-game-container');
        this._renderLayout();
    }

    start() {
        super.start();
        this._resumeStateFromGlobals();
        const reviewedVar = this.params.reviewedVar || 'fdp_reviewed';
        if (!window.gameState?.globalVariables?.[reviewedVar]) {
            this._setGlobalAndNotify(reviewedVar, true);
        }
        if (this._tabs.length > 0) this._onTabClick(this._tabs[0].id);
    }

    _resumeStateFromGlobals() {
        const globals  = window.gameState?.globalVariables || {};
        const confirmedVar = this.params.confirmedVar || 'forensic_chain_verified';
        if (globals[confirmedVar] === true) {
            this._confirmed = true;
        }
    }

    // ── Layout ───────────────────────────────────────────────────────────────

    _renderLayout() {
        const title        = this.params.title        || 'Forensic Data Platform';
        const caseRef      = this.params.caseRef      || '';
        const confirmLabel = this.params.confirmLabel || 'CONFIRM CAUSAL CHAIN';
        const confirmHint  = this.params.confirmHint  || 'Review all evidence before confirming.';

        const tabButtons = this._tabs.map(t =>
            `<button class="fdp-tab" data-tab="${t.id}">${displayDashes(t.label)}</button>`
        ).join('');

        this.gameContainer.innerHTML = `
<div class="fdp-wrap">
  <div class="fdp-header">
    <span class="fdp-title">${displayDashes(title)}</span>
    <span class="fdp-case">${displayDashes(caseRef)}</span>
  </div>
  <div class="fdp-tab-bar" id="fdp-tab-bar">
    ${tabButtons}
  </div>
  <div class="fdp-panel" id="fdp-panel"></div>
  <div class="fdp-footer">
    <button class="fdp-confirm-btn" id="fdp-confirm-btn" disabled>
      ${displayDashes(confirmLabel)}
    </button>
    <div id="fdp-confirm-hint" class="fdp-confirm-hint">${displayDashes(confirmHint)}</div>
  </div>
</div>`;

        this.gameContainer.querySelectorAll('.fdp-tab').forEach(btn => {
            this.addEventListener(btn, 'click', () => this._onTabClick(btn.dataset.tab));
        });
        this.addEventListener(this.gameContainer.querySelector('#fdp-confirm-btn'), 'click', () => this._onConfirm());
    }

    // ── Tab interaction ───────────────────────────────────────────────────────

    _onTabClick(tabId) {
        this.gameContainer.querySelectorAll('.fdp-tab').forEach(btn => {
            const isActive = btn.dataset.tab === tabId;
            btn.classList.toggle('fdp-tab-active', isActive);
            if (this._tabsSeen.has(btn.dataset.tab) && !isActive) {
                btn.classList.add('fdp-tab-seen');
            }
        });

        this._tabsSeen.add(tabId);
        const activeBtn = this.gameContainer.querySelector(`[data-tab="${tabId}"]`);
        if (activeBtn) activeBtn.classList.add('fdp-tab-seen');

        this._renderTabContent(tabId);
        this._updateConfirmButton();
    }

    _updateConfirmButton() {
        if (this._confirmed) return;
        const btn  = this.gameContainer.querySelector('#fdp-confirm-btn');
        const hint = this.gameContainer.querySelector('#fdp-confirm-hint');
        if (!btn || !hint) return;

        const gateTab    = this.params.confirmGateTab   || this._tabs[this._tabs.length - 1]?.id;
        const confirmHint  = this.params.confirmHint      || 'Review all evidence before confirming.';
        const readyHint    = this.params.confirmReadyHint || 'All critical evidence reviewed. Confirm the causal chain.';

        if (this._tabsSeen.has(gateTab)) {
            btn.disabled     = false;
            hint.textContent = displayDashes(readyHint);
        } else {
            btn.disabled     = true;
            hint.textContent = displayDashes(confirmHint);
        }
    }

    _onConfirm() {
        if (this._confirmed) return;
        this._confirmed = true;

        const confirmedVar = this.params.confirmedVar       || 'forensic_chain_verified';
        const successText  = this.params.confirmSuccessText || '✓ Causal chain confirmed and logged.';
        const confirmLabel = this.params.confirmLabel       || 'CONFIRM CAUSAL CHAIN';

        const btn  = this.gameContainer.querySelector('#fdp-confirm-btn');
        const hint = this.gameContainer.querySelector('#fdp-confirm-hint');
        if (btn)  { btn.disabled = true; btn.textContent = displayDashes(`${confirmLabel} — CONFIRMED`); }
        if (hint) { hint.className = 'fdp-confirm-success'; hint.textContent = displayDashes(successText); }

        this._setGlobalAndNotify(confirmedVar, true);
        this._executeCompletionActions();
    }

    _executeCompletionActions() {
        const actions = this.params.completionActions;
        if (!Array.isArray(actions)) return;
        for (const action of actions) {
            if (action.type === 'set_global') {
                this._setGlobalAndNotify(action.key, action.value);
            } else if (action.type === 'complete_task') {
                window.objectivesManager?.completeTask(action.taskId);
            }
        }
    }

    // ── Tab content ───────────────────────────────────────────────────────────

    _renderTabContent(tabId) {
        const panel = this.gameContainer.querySelector('#fdp-panel');
        if (!panel) return;
        const tab = this._tabs.find(t => t.id === tabId);
        if (!tab) { panel.innerHTML = ''; return; }
        const globals = window.gameState?.globalVariables || {};
        const heading = tab.heading ? `<h3>${displayDashes(tab.heading)}</h3>` : '';
        panel.innerHTML = heading + _renderBlocks(tab.blocks, globals);
    }

    // ── Global state ──────────────────────────────────────────────────────────

    _setGlobalAndNotify(name, value) {
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
        super.cleanup();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Starter helper
// ─────────────────────────────────────────────────────────────────────────────

export function startForensicDataPlatformMinigame(scenarioData = {}, extraParams = {}) {
    if (!window.MinigameFramework) {
        console.error('[FDP] MinigameFramework not available');
        return;
    }
    window.MinigameFramework.startMinigame('forensic-data-platform', null, {
        showCancel: true,
        ...scenarioData,
        ...extraParams,
        onComplete: (success, result) => {
            console.log('[FDP] Forensic Data Platform closed');
            if (extraParams.onComplete) extraParams.onComplete(success, result);
        }
    });
}
