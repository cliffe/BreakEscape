// The rogue AP console's rules, with no DOM (physical pentest devices plan 4.1 step 4, 4.3, 4.4).
// Every string the console shows comes from the planted object's authored data:
//
//   apScan        [{ ssid, security, signal, clients, inScope, refusal, cloneGlobals, cloneLog,
//                    knownClients: [{ npcId, label }] }]
//   apPortal      { templates: [{ id, label, setGlobals, page }] }
//   apCaptureLog  [{ global, text, npcId }]
//
// The Log holds no state of its own: it is read back from the globals each Start writes, so a
// reload shows the same lines and the same chosen template.

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v) => (typeof v === 'string' ? v : (v == null ? '' : String(v)));

/** The authored scan rows, cleaned: rows with no SSID are dropped. */
export function scanRows(apScan) {
    if (!Array.isArray(apScan)) return [];
    return apScan.filter((r) => isObj(r) && str(r.ssid)).map((r) => ({
        ssid: str(r.ssid),
        security: str(r.security),
        signal: r.signal,
        clients: Number.isFinite(Number(r.clients)) ? Number(r.clients) : null,
        inScope: r.inScope !== false,
        refusal: str(r.refusal),
        cloneGlobals: isObj(r.cloneGlobals) ? r.cloneGlobals : {},
        cloneLog: r.cloneLog,
        knownClients: Array.isArray(r.knownClients)
            ? r.knownClients.filter((c) => isObj(c) && (c.npcId || c.label)).map((c) => ({ npcId: c.npcId ? str(c.npcId) : null, label: str(c.label) }))
            : []
    }));
}

/** The authored portal templates, cleaned: each needs an id. */
export function portalTemplates(apPortal) {
    const list = isObj(apPortal) && Array.isArray(apPortal.templates) ? apPortal.templates : [];
    return list.filter((t) => isObj(t) && str(t.id)).map((t) => ({
        id: str(t.id),
        label: str(t.label) || str(t.id),
        setGlobals: isObj(t.setGlobals) ? t.setGlobals : {},
        page: isObj(t.page) ? t.page : null
    }));
}

/** The authored capture log lines, cleaned. */
export function captureLogLines(apCaptureLog) {
    if (!Array.isArray(apCaptureLog)) return [];
    return apCaptureLog.filter((l) => isObj(l) && str(l.global) && str(l.text))
        .map((l) => ({ global: str(l.global), text: str(l.text), npcId: l.npcId ? str(l.npcId) : null }));
}

/**
 * A signal value as a word: a number of bars (0 to 4; above 4 is read as a percentage) or an
 * authored word, which is kept. Empty when nothing is authored.
 */
export function signalWord(signal) {
    if (typeof signal === 'string' && signal && !Number.isFinite(Number(signal))) return signal;
    const n = Number(signal);
    if (signal === null || signal === undefined || signal === '' || !Number.isFinite(n)) return '';
    const bars = n > 4 ? Math.round((n / 100) * 4) : n;
    if (bars >= 3) return 'Strong';
    if (bars >= 2) return 'Fair';
    return 'Weak';
}

/** "3 clients", "1 client", or empty when no count is authored. */
export function clientsText(count) {
    if (count === null || count === undefined) return '';
    return `${count} ${count === 1 ? 'client' : 'clients'}`;
}

const matches = (wanted, globals) => {
    const keys = Object.keys(wanted || {});
    return keys.length > 0 && keys.every((k) => (globals || {})[k] === wanted[k]);
};

/**
 * What Start does for one scan row and one template: the writes in order (the row's
 * cloneGlobals, then the template's setGlobals), or a refusal that writes nothing.
 */
export function cloneEffects(row, template) {
    if (!row) return { refused: true, refusal: '', writes: [] };
    if (row.inScope === false) return { refused: true, refusal: row.refusal || 'Out of scope.', writes: [] };
    const writes = [];
    for (const [k, v] of Object.entries(row.cloneGlobals || {})) writes.push([k, v]);
    for (const [k, v] of Object.entries(template?.setGlobals || {})) writes.push([k, v]);
    return { refused: false, refusal: '', writes };
}

/** The in-scope row whose cloneGlobals all hold now (the running clone), or null. */
export function activeClone(rows, globals) {
    return rows.find((r) => r.inScope && matches(r.cloneGlobals, globals)) || null;
}

/** The template whose setGlobals all hold now, or null. */
export function activeTemplate(templates, globals) {
    return templates.find((t) => matches(t.setGlobals, globals)) || null;
}

/** A row's clone log line for a template: a string, or an object keyed by template id. */
export function cloneLogText(row, template) {
    if (!row) return '';
    const log = row.cloneLog;
    if (typeof log === 'string') return log;
    if (isObj(log) && template && typeof log[template.id] === 'string') return log[template.id];
    return '';
}

/**
 * The Log tab's lines, derived from the globals: the running clone's line (with its template)
 * first, then each capture line whose global is true, in authored order.
 */
export function logLines({ rows, templates, captureLines, globals }) {
    const out = [];
    const row = activeClone(rows, globals);
    if (row) {
        const template = activeTemplate(templates, globals);
        const text = cloneLogText(row, template);
        if (text) out.push({ kind: 'clone', text, npcId: null, ssid: row.ssid });
    }
    for (const line of captureLines) {
        if ((globals || {})[line.global] === true) out.push({ kind: 'capture', text: line.text, npcId: line.npcId, global: line.global });
    }
    return out;
}

/**
 * The selection the Clone tab opens with: the running clone and its template when there is
 * one, else the first row and the first template.
 */
export function initialSelection(rows, templates, globals) {
    const row = activeClone(rows, globals);
    const template = row ? activeTemplate(templates, globals) : null;
    return {
        ssid: row?.ssid ?? rows[0]?.ssid ?? null,
        templateId: template?.id ?? templates[0]?.id ?? null
    };
}
