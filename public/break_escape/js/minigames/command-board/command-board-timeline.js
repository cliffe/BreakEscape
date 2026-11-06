/**
 * Command board timeline and status logic, kept free of the DOM so it can be tested.
 *
 * Entries come from definitions: each watches some globals and has a condition. A
 * CommandBoardRecorder runs from game start in scenarios that have a command board
 * (core/game.js), listening to those globals. When one changes and a definition
 * becomes true, it stamps that entry with the game time (systems/game-clock.js) and
 * keeps it, so entries are timed right even when the board is closed or its room
 * isn't loaded, and sort by time (newest first). Only { id, t } per entry is saved
 * (state-sync.js, `commandBoardLog`). Transient states count: a patient who went
 * critical and then died gets both entries.
 *
 * The built-in definitions are sis01's (the board was built for it). A scenario can
 * give its own on the command_board object:
 *   "commandBoard": {
 *     "title": "...", "subtitle": "...",
 *     "preseed": [{ "timestamp": "Mon 22:38", "text": "...", "type": "security" }],
 *     "timeline": [{ "id": "x", "condition": "globalVars.a === true", "text": "...", "type": "response" }],
 *     "statusRows": [{ "label": "EHR", "states": [{ "condition": "globalVars.ehr_down", "state": "OFFLINE", "label": "OFFLINE" }],
 *                      "default": { "state": "OPERATIONAL", "label": "OPERATIONAL" } }]
 *   }
 * "timeline" replaces the built-in entries ("extendBuiltIn": true adds to them); a
 * definition's "watch" (a name or a list) defaults to the globals its condition reads;
 * "decidedOnChange": true judges it only when a watched global changes (an entry that
 * didn't hold then never appears later).
 */

import { evaluateGlobalCondition, globalsInCondition } from '../../utils/global-condition.js';

export const DEFAULT_TITLE = 'NORTHGATE GENERAL HOSPITAL - MAJOR INCIDENT RESPONSE';
export const DEFAULT_SUBTITLE = 'LIVE INCIDENT BOARD';

export const DEFAULT_PRESEED = [
    {
        timestamp: 'Mon 22:38',
        text: 'MAJOR INCIDENT DECLARED - Enterprise IT systems encrypted.',
        type: 'security'
    }
];

export function normalizeBackupRecoverySource(value) {
    const raw = String(value || '').toUpperCase();
    if (raw === 'CLOUD_VENDOR') return 'CLOUD';
    if (raw === 'NAS_ENCRYPTED' || raw === 'NAS_SNAPSHOT') return 'NAS';
    if (raw === 'TAPE_WIPED' || raw === 'TAPE_LIBRARY') return 'TAPE';
    return raw;
}

const upper = (v) => String(v || '').toUpperCase();

/**
 * sis01's entries. `watch`: the globals whose change can make the entry happen;
 * `when`: whether it holds for a set of globals.
 */
export const BUILTIN_TIMELINE = [
    {
        id: 'network_isolated_authorised',
        watch: ['network_isolated'],
        when: (g) => g.network_isolated === true && g.network_isolation_authorised === true,
        text: 'NETWORK ISOLATED (AUTHORISED) - Dual sign-off confirmed. Clinical zone severed from enterprise; ward central monitoring remains offline.',
        type: 'response'
    },
    {
        id: 'network_isolated_bypassed',
        watch: ['network_isolated'],
        when: (g) => g.network_isolated === true && g.network_isolation_authorised !== true,
        text: 'NETWORK ISOLATED (BYPASSED) - Isolation executed without dual sign-off; governance breach recorded. Ward central monitoring remains offline.',
        type: 'response'
    },
    {
        id: 'backup_recovery_cloud',
        watch: ['backup_recovery_source', 'backup_restore_initiated'],
        when: (g) => normalizeBackupRecoverySource(g.backup_recovery_source) === 'CLOUD'
            || (!g.backup_recovery_source && g.backup_restore_initiated === true),
        text: 'CLOUD RESTORE INITIATED - EHR recovery ETA 18 hours; ward monitoring remains on bedside/manual observation in this response window.',
        type: 'response'
    },
    {
        id: 'backup_recovery_local',
        watch: ['backup_recovery_source'],
        when: (g) => ['NAS', 'TAPE'].includes(normalizeBackupRecoverySource(g.backup_recovery_source)),
        // sis01 blind playtest: the NAS and tape are real options now, each with a cost
        text: (g) => (normalizeBackupRecoverySource(g.backup_recovery_source) === 'NAS'
            ? 'NAS RESTORE INITIATED - Sunday snapshot, scanned for known indicators only. ETA 5 hours; Monday\'s records to be re-entered from paper.'
            : 'TAPE RESTORE INITIATED - Catalogue rebuild 3-5 days; nothing after Friday night is recoverable.'),
        type: 'decision'
    },
    {
        // Was keyed on drug_library_verified, which is set by the restore, so the
        // "tampered" line appeared only at the restore and the restore had no line (D9)
        id: 'drug_library_tampered',
        watch: ['drug_library_compromised'],
        when: (g) => g.drug_library_compromised === true,
        text: 'DRUG LIBRARY TAMPERED - Morphine limits altered; the prescribed dose now reads as too low. Every pump to be checked against the paper chart.',
        type: 'security'
    },
    {
        id: 'drug_library_restored',
        watch: ['drug_library_restored', 'drug_library_verified'],
        when: (g) => g.drug_library_restored === true || g.drug_library_verified === true,
        text: 'DRUG LIBRARY RESTORED - Verified backup reinstalled. Morphine limits back to the ward range (0.5-4 mg/hr).',
        type: 'response'
    },
    {
        id: 'patient_bed4_critical',
        watch: ['patient_bed4_state'],
        when: (g) => upper(g.patient_bed4_state) === 'CRITICAL',
        text: 'PATIENT DETERIORATION - Ward 7 Bed 4. Cardiac arrhythmia. Central monitoring unavailable; bedside alarm escalation required.',
        type: 'critical'
    },
    {
        id: 'patient_bed4_deceased',
        watch: ['patient_bed4_state', 'patient_bed4_deceased'],
        when: (g) => upper(g.patient_bed4_state) === 'DECEASED' || g.patient_bed4_deceased === true,
        text: 'PATIENT DEATH - Ward 7 Bed 4. Cardiac arrhythmia. No central monitoring response. Clinical team response delayed 22 minutes.',
        type: 'critical'
    },
    {
        id: 'patient_bed2_critical',
        watch: ['patient_bed2_state'],
        when: (g) => upper(g.patient_bed2_state) === 'CRITICAL',
        text: 'PATIENT DETERIORATION - Ward 7 Bed 2. Opioid toxicity suspected after a wrong pump rate.',
        type: 'critical'
    },
    {
        // D15: was missing on the fatal path, and said "guardrails disabled" (m9)
        id: 'patient_bed2_deceased',
        watch: ['patient_bed2_state', 'patient_bed2_deceased'],
        when: (g) => upper(g.patient_bed2_state) === 'DECEASED' || g.patient_bed2_deceased === true,
        text: 'PATIENT DEATH - Ward 7 Bed 2. Morphine overdose. Tampered library called the prescribed dose too low; the wrong rate went through.',
        type: 'critical'
    },
    {
        id: 'bed2_alarm_raised',
        watch: ['bed2_alarm_raised'],
        when: (g) => g.bed2_alarm_raised === true && g.pump_dose_error === true,
        text: 'BED 2 ALARM RAISED - Overdose recognised at the bedside; naloxone given.',
        type: 'clinical'
    },
    {
        id: 'ico_notified',
        watch: ['ico_notified', 'ico_notification_sent'],
        when: (g) => g.ico_notified === true || g.ico_notification_sent === true,
        text: 'ICO NOTIFIED - 72hr statutory notification submitted',
        type: 'decision'
    },
    {
        id: 'ico_deadline_missed',
        watch: ['ico_deadline_missed'],
        when: (g) => g.ico_deadline_missed === true,
        text: 'ICO NOTIFICATION DEADLINE MISSED - 72-hour GDPR window expired.',
        type: 'critical'
    },
    {
        id: 'backup_reinfected',
        watch: ['backup_reinfected'],
        when: (g) => g.backup_reinfected === true,
        text: 'EHR RESTORE FAILED - Ransomware reactivated from backup. Second rebuild required. Clinical operations extended by 5 days.',
        type: 'critical'
    },
    {
        id: 'siem_escalated',
        watch: ['siem_escalated'],
        when: (g) => g.siem_escalated === true,
        text: 'SIEM ALERTS ESCALATED - Critical indicators identified',
        type: 'response'
    },
    {
        // sis01 blind playtest D4: logged only when the triage ended with a critical alert
        // not escalated, not when one was dismissed and then undone.
        id: 'siem_missed_alerts',
        watch: ['siem_missed_alerts'],
        when: (g) => g.siem_missed_alerts === true && g.siem_escalated !== true,
        text: 'CRITICAL ALERTS MISSED - delayed escalation',
        type: 'security'
    },
    {
        id: 'ncsc_notified',
        watch: ['ncsc_notified'],
        when: (g) => g.ncsc_notified === true,
        text: 'NCSC NOTIFIED - incident support request submitted',
        type: 'decision'
    },
    {
        id: 'vpn_anomaly_identified',
        watch: ['vpn_anomaly_identified'],
        when: (g) => g.vpn_anomaly_identified === true,
        text: 'VPN ANOMALY CONFIRMED - Contractor credentials used from a Tor exit node, no MFA',
        type: 'security'
    },
    {
        id: 'safety_claim_hc001_assessed',
        watch: ['safety_claim_hc001_assessed'],
        when: (g) => g.safety_claim_hc001_assessed === true,
        text: 'SAFETY CLAIM ASSESSED - CLAIM-HC-001 (Network Segmentation) INVALIDATED. Dual-homed workstations and legacy flat segments breach the claim conditions.',
        type: 'decision'
    },
    {
        id: 'safety_claim_hc003_assessed',
        watch: ['safety_claim_hc003_assessed'],
        when: (g) => g.safety_claim_hc003_assessed === true,
        text: 'SAFETY CLAIM ASSESSED - CLAIM-HC-003 (Drug Library Integrity) INVALIDATED. Library tampered; change control bypassed; pharmacy approval not obtained.',
        type: 'decision'
    },
    {
        id: 'safety_claim_hc007_assessed',
        watch: ['safety_claim_hc007_assessed'],
        when: (g) => g.safety_claim_hc007_assessed === true,
        text: 'SAFETY CLAIM ASSESSED - CLAIM-HC-007 (Integrated Incident Response). Dual-authorisation process engaged. Clinical impact assessed before isolation.',
        type: 'decision'
    },
    {
        id: 'patient_bed4_attended',
        watch: ['patient_bed4_state'],
        when: (g) => upper(g.patient_bed4_state) === 'ATTENDED',
        text: 'BED 4 PATIENT ESCALATED - Clinical team responding',
        type: 'response'
    },
    {
        id: 'paper_charts_collected',
        watch: ['paper_charts_collected'],
        when: (g) => g.paper_charts_collected === true,
        text: 'PAPER MAR CHARTS RETRIEVED',
        type: 'response'
    },
    {
        id: 'pump_dose_correct',
        watch: ['pump_dose_correct'],
        when: (g) => g.pump_dose_correct === true,
        text: 'BEDSIDE PUMP PROGRAMMED - Dose verified correct',
        type: 'clinical'
    },
    {
        // D15: a wrong rate is "caught" only once the restored library's double-check
        // is in place. Judged once, when the rate went in (decidedOnChange), not when the
        // board opened; the death check covers an old save reconciled at load.
        id: 'pump_dose_error_caught',
        watch: ['pump_dose_error'],
        decidedOnChange: true,
        when: (g) => g.pump_dose_error === true && g.drug_library_restored === true && g.patient_bed2_deceased !== true,
        text: 'BEDSIDE PUMP PROGRAMMED - Double-check caught a wrong rate',
        type: 'clinical'
    },
    {
        id: 'pump_dose_entered_unchecked',
        watch: ['pump_dose_error'],
        decidedOnChange: true,
        when: (g) => g.pump_dose_error === true && g.drug_library_restored !== true,
        text: 'BEDSIDE PUMP PROGRAMMED - Bed 2 morphine infusion started; no library alert.',
        type: 'clinical'
    }
];

/** Turn a scenario's timeline definition into the built-in shape. */
export function compileTimelineDefinition(def) {
    if (!def || typeof def !== 'object' || !def.id || !def.text) return null;
    const watch = def.watch ? (Array.isArray(def.watch) ? def.watch : [def.watch]) : globalsInCondition(def.condition);
    return {
        id: String(def.id),
        watch,
        decidedOnChange: def.decidedOnChange === true,
        when: (g) => evaluateGlobalCondition(def.condition, g),
        text: String(def.text),
        type: def.type || 'response'
    };
}

/** The timeline definitions for a board, from its scenario config or the built-ins. */
export function timelineDefinitions(config) {
    const custom = Array.isArray(config?.timeline)
        ? config.timeline.map(compileTimelineDefinition).filter(Boolean)
        : null;
    if (!custom) return BUILTIN_TIMELINE;
    return config.extendBuiltIn ? [...BUILTIN_TIMELINE, ...custom] : custom;
}

function holds(def, globals) {
    try {
        return !!def.when(globals);
    } catch (e) {
        return false;
    }
}

function entryText(def, globals) {
    return typeof def.text === 'function' ? def.text(globals) : def.text;
}

/**
 * Records board entries as they happen. Lives outside the minigame (window.
 * commandBoardRecorder), created at game start when the scenario has a board.
 */
export class CommandBoardRecorder {
    /**
     * @param {Object} opts
     * @param {Object} [opts.config] - the board object's commandBoard config
     * @param {Array} [opts.saved] - [{ id, t }] saved at the last sync
     * @param {Object} [opts.initialGlobals] - the scenario's starting globals: what is
     *   true there is the starting situation, not something that happened
     * @param {Function} [opts.now] - game time in ms
     */
    constructor({ config = {}, saved = [], initialGlobals = {}, now = () => 0 } = {}) {
        this.defs = timelineDefinitions(config);
        this.now = now;
        this.recorded = new Map();   // id -> game ms
        for (const e of Array.isArray(saved) ? saved : []) {
            if (e && typeof e.id === 'string' && Number.isFinite(e.t) && !this.recorded.has(e.id)) {
                this.recorded.set(e.id, e.t);
            }
        }
        this.atStart = new Set(this.defs.filter(d => holds(d, initialGlobals || {})).map(d => d.id));
        this._sub = null;
    }

    _record(def, globals, fromChange = false) {
        if (this.recorded.has(def.id) || this.atStart.has(def.id)) return false;
        if (!holds(def, globals)) {
            // A decidedOnChange entry that didn't hold when its global changed is settled:
            // saved as t = -1 and never shown, so a later state can't make it true
            if (fromChange && def.decidedOnChange) this.recorded.set(def.id, -1);
            return false;
        }
        this.recorded.set(def.id, this.now());
        return true;
    }

    /** A global changed: record any entry it made true, at the current game time. */
    onChange(name, globals) {
        let added = 0;
        for (const def of this.defs) {
            if (def.watch?.length && !def.watch.includes(name)) continue;
            if (this._record(def, globals, true)) added++;
        }
        return added;
    }

    /**
     * Record entries true now but not yet recorded: on load (a save from before the
     * board kept its own log, or a change made after the last sync), and when the board
     * opens (a global set without an event). They are stamped with the current game time.
     */
    reconcile(globals) {
        let added = 0;
        for (const def of this.defs) if (this._record(def, globals || {})) added++;
        return added;
    }

    /** Listen to global changes from game start. */
    attach(eventDispatcher, getGlobals) {
        if (!eventDispatcher?.on || this._sub) return;
        const handler = (payload, eventType) => {
            const name = (typeof eventType === 'string' && eventType.startsWith('global_variable_changed:'))
                ? eventType.slice('global_variable_changed:'.length)
                : (payload?.varName ?? payload?.name);
            if (name) this.onChange(name, getGlobals());
        };
        eventDispatcher.on('global_variable_changed:*', handler);
        this._sub = { eventDispatcher, handler };
    }

    detach() {
        if (this._sub) this._sub.eventDispatcher.off?.('global_variable_changed:*', this._sub.handler);
        this._sub = null;
    }

    /** [{ id, t }] for the server, oldest first. */
    exportLog() {
        return Array.from(this.recorded, ([id, t]) => ({ id, t })).sort((a, b) => a.t - b.t);
    }

    /** Recorded entries with their text, oldest first ({ id, t, text, type }). */
    entries(globals) {
        const byId = new Map(this.defs.map(d => [d.id, d]));
        return this.exportLog()
            .filter(e => e.t >= 0 && byId.has(e.id))
            .map(e => {
                const def = byId.get(e.id);
                return { id: e.id, t: e.t, text: entryText(def, globals || {}), type: def.type };
            });
    }
}

/** Order for display: newest first; preseed entries at the bottom. */
export function sortEntries(entries) {
    const key = (e) => (Number.isFinite(e.atMs) ? e.atMs : (e.source === 'preseed' ? -1 : -0.5));
    return entries.slice().sort((a, b) => key(b) - key(a));
}

/**
 * Board entries: the preseed, the player's manual entries and the recorded auto
 * entries, newest first.
 * @param {Array} manual - manual entries saved by the board
 * @param {Array} recorded - CommandBoardRecorder.entries() output
 * @param {Function} stamp - game ms -> display timestamp
 * @param {Array} preseed
 */
export function buildEntries(manual, recorded, stamp, preseed) {
    const out = (preseed || []).map((p, i) => ({
        timestamp: p.timestamp || '',
        text: p.text,
        type: p.type || 'security',
        source: 'preseed',
        eventKey: `preseed:${p.id || i}`
    }));
    out.push(...(Array.isArray(manual) ? manual : []).filter(e => e?.source === 'manual'));
    for (const r of recorded) {
        out.push({ timestamp: stamp(r.t), text: r.text, type: r.type, source: 'auto', eventKey: `event:${r.id}`, atMs: r.t });
    }
    return sortEntries(out);
}

/** Built-in (sis01) status rows. */
export function computeBuiltinStatuses(globals) {
    const inferredEhr = globals.network_isolated === true ? 'OFFLINE' : 'ONLINE';
    const inferredFleet = globals.network_isolated === true ? 'OFFLINE' : 'ONLINE';
    const inferredMonitoring = globals.ransomware_deployed === true ? 'OFFLINE' : 'UNKNOWN';

    const normalizedEhr = upper(globals.ehr_status || inferredEhr);
    const normalizedMonitoring = upper(globals.ward_monitor_status || globals.central_station_ward7_status || inferredMonitoring);
    const normalizedFleet = upper(globals.fleet_console_status || inferredFleet);
    const normalizedBackup = normalizeBackupRecoverySource(globals.backup_recovery_source)
        || (globals.backup_restore_initiated === true ? 'CLOUD' : '');

    const ehr = (() => {
        if (globals.backup_reinfected === true) return { key: 'REINFECTED', label: 'REINFECTED' };
        if (['CLOUD', 'NAS', 'TAPE'].includes(normalizedBackup)) return { key: 'RESTORING', label: 'RESTORING' };
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
        // D9: a verified restore clears COMPROMISED
        if (globals.drug_library_restored === true || globals.drug_library_verified === true) {
            return { key: 'OPERATIONAL', label: 'VERIFIED' };
        }
        if (globals.drug_library_compromised === true) return { key: 'COMPROMISED', label: 'COMPROMISED' };
        if (normalizedFleet === 'OFFLINE') return { key: 'OFFLINE', label: 'OFFLINE' };
        if (normalizedFleet === 'ONLINE') return { key: 'OPERATIONAL', label: 'OPERATIONAL' };
        return { key: 'UNKNOWN', label: 'UNKNOWN' };
    })();

    const backups = (() => {
        if (globals.backup_reinfected === true) return { key: 'REINFECTED', label: 'REINFECTED' };
        if (normalizedBackup === 'CLOUD') return { key: 'RESTORING', label: 'CLOUD' };
        if (normalizedBackup === 'NAS') return { key: 'RESTORING', label: 'NAS' };
        if (normalizedBackup === 'TAPE') return { key: 'RESTORING', label: 'TAPE' };
        return { key: 'UNKNOWN', label: 'UNKNOWN' };
    })();

    const network = globals.network_isolated === true
        ? { key: 'ISOLATED', label: 'ISOLATED' }
        : { key: 'CONNECTED', label: 'CONNECTED' };

    const ransomware = globals.ransomware_deployed === true
        ? { key: 'ACTIVE', label: 'ACTIVE' }
        : { key: 'CLEAN', label: 'CLEAN' };

    return [
        { label: 'EHR SYSTEM', status: ehr },
        { label: 'WARD 7 MONITORING', status: monitoring },
        { label: 'FLEET CONSOLE', status: fleet },
        { label: 'BACKUPS', status: backups },
        { label: 'NETWORK', status: network },
        { label: 'RANSOMWARE', status: ransomware }
    ];
}

/** Status rows: the scenario's statusRows if given, else the built-in ones. */
export function computeStatusRows(config, globals) {
    if (!Array.isArray(config?.statusRows)) return computeBuiltinStatuses(globals);
    return config.statusRows.map((row) => {
        const match = (Array.isArray(row.states) ? row.states : [])
            .find(s => evaluateGlobalCondition(s.condition, globals));
        const chosen = match || row.default || { state: 'UNKNOWN', label: 'UNKNOWN' };
        const key = upper(chosen.state || chosen.label || 'UNKNOWN');
        return { label: String(row.label || ''), status: { key, label: String(chosen.label || key) } };
    });
}
