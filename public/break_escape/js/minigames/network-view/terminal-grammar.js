/**
 * TERMINAL GRAMMAR (Ops S6 unit 09)
 * =================================
 *
 * What a line typed in the Terminal skin means. Pure: it imports only ops-model.js,
 * view-texts.js, view-controls.js and cli-gen/defaults.js, touches no DOM, storage or clock, and
 * imports no generator. It resolves a line only to an offer that is in the current offer list;
 * a line that names anything else sends nothing.
 *
 * `parse(line, offers, view, mode)` returns one of
 *
 *   { kind: 'offer',   offer, notes, before?, mode? }  one offer from the list; `notes` are note
 *                                                       lines (strings) to print before it is sent
 *   { kind: 'local',   name, args, before?, mode? }    sends nothing; another module draws it
 *   { kind: 'message', lines }                         an answer that sends nothing; `lines` is an
 *                                                       array of plain strings (empty: do nothing)
 *
 * `before` (extra to the brief) holds the earlier local results of a `;` line, to draw first.
 * `mode` is present when the line changed the mode: { prompt: 'shell' | 'msf', module, technique }
 * (`module` is a finding id, kept inside the mode and never printed). A line that carries its own
 * prompt mark (`$` or `msf >`) never sets `mode`.
 *
 * Local names and their `args`:
 *   help { verb: string | null }          show {}                clear {}
 *   exit {} (with `mode` shell when it leaves the framework; without `mode` it closes the terminal)
 *   panels {}                             msfconsole {} (mode msf)      back {} (module cleared)
 *   msf.search { word }                   msf.use { findingId, alias, module } (module selected)
 *   msf.info { findingId, alias }         msf.options { findingId, alias }
 *   msf.set { name: 'TECHNIQUE', value }  msf.unset { name: 'TECHNIQUE' }
 *   msf.sessions {}                       sweep.listed { networkId, block, rows }
 */
import {
    findFinding, rowFindings, techniqueList, isHostRow, refusalText
} from './ops-model.js';
import {
    REMOTE_OFF_TEXT, NOT_RESPONDING_TEXT, NO_ROUTE_TEXT, SHARE_LOCKED_TEXT
} from './view-texts.js';
import { CONTROLS, hostAction, resourceAction } from './view-controls.js';
import { findingCli, serviceCli } from './cli-gen/defaults.js';

// ---------------------------------------------------------------------------------------------
// Fixed texts
// ---------------------------------------------------------------------------------------------

const T = Object.freeze({
    ONE_ACTION: 'One action at a time.',
    ONE_TARGET: 'One target at a time in this simulation.',
    PIPES: 'Pipes and redirects are not part of this simulation.',
    WAITING: 'Still waiting for the last answer.',
    TOO_LONG: 'That line is too long.',
    NMAP_FILE: 'Reading targets from a file is not part of this simulation.',
    NMAP_SN_HOST: '-sn only finds hosts. Use nmap -sV <host> to list its services.',
    NMAP_VERSIONS: 'Versions are listed per host: nmap -sV <host>.',
    NMAP_P_IGNORED: 'The version scan lists every service here; -p is ignored.',
    NMAP_PROTOCOL: '<port> is a <protocol> port here.',
    NMAP_IGNORED: 'Ignored in this simulation: <flag>',
    NMAP_NO_TARGET: 'Name a target: nmap -sV <host>.',
    NAME_PORT: 'Name a port with -p:',
    NAME_SERVICE: 'Name a service or port:',
    NO_SERVICES: 'No service is listed on <host>. Scan it first.',
    SET_TECHNIQUE: 'Set TECHNIQUE first. Held: <ids>',
    SELECT_MODULE: 'Select a module first: use <module>',
    NO_MODULE: 'No such module. Try search.',
    RHOSTS_RPORT: 'RHOSTS and RPORT come from the module in this simulation.',
    NO_OPTION: 'No such option in this simulation.',
    NOT_PART: 'Not part of this simulation.',
    TECHNIQUE_HELD: 'TECHNIQUE must be one you hold: <ids>',
    HOLD_NONE: 'You hold no techniques.',
    USE_FORM: 'Use a held technique on a finding: use <technique> on <alias>',
    TECHNIQUES_HELD: 'Techniques held: <ids>',
    WORKS_ON: '<verb> works on: <ids>',
    NOTHING_TO: 'Nothing to <verb> here.',
    COULD_BE: 'Could be: <ids>',
    MORE_THAN_ONE: 'More than one matches: <ids>',
    NAME_NETWORK: 'Name a network: <ids>',
    NO_NETWORK: 'No network is listed here.',
    UNKNOWN: 'Unknown command. Did you mean <verb>?',
    NO_UNPLUG: 'There is no box to unplug here.',
    HAVE_SESSION: 'You hold a session on <host>. Use open <host>.',
    NO_SESSION: 'No session is held on <host>. Use signin <host>.',
    LOCKED_SESSION: 'That session is locked. Use signin <host>.',
    SCAN_FIRST: 'Scan <host> first.',
    NOT_ON_OFFER: 'Not on offer right now.',
    USE_LOOK: 'Use look <id> for that.',
    USE_OPEN: 'Use open <id> for that.',
    HELP_HEAD_SHELL: 'Commands (the game verbs always work):',
    HELP_HEAD_MSF: 'Framework commands (the game verbs also work):',
    HELP_NMAP_FORMS: 'nmap [flags] <target>: a network id or range sweeps; a host id or address scans; add --script <name> to check one service (name it with -p).',
    HELP_NMAP_VALUE: 'Flags that take a value: -p, --script, -oN, -oX, -oG, -oA, --top-ports, --min-rate, --max-retries, -e.',
    HELP_NMAP_KNOWN: 'Flags accepted and ignored: -sS, -sT, -sU, -sV, -sC, -A, -O, -Pn, -n, -v, -vv, -T0 to -T5, -sn.',
    HELP_CHECK_SHELL: 'check <host> <service or port>: look for weaknesses in one service. Inside msfconsole, check finds out whether the selected module is real.',
    HELP_CHECK_MSF: 'check: find out whether the selected module is real (the game verb confirm does the same). Outside msfconsole, check <host> <service or port> looks for weaknesses in one service.',
    HELP_USE_SHELL: 'use <technique> on <alias>: try a technique you hold on a finding (run is the same). Inside msfconsole, use selects a module.',
    HELP_USE_MSF: 'use <module, alias or number>: select a module. Outside msfconsole, use <technique> on <alias> tries a technique.',
    HELP_RUN: 'run (or exploit): use the technique set in TECHNIQUE on the selected module.',
    HELP_SEARCH: 'search [word]: list the modules.',
    HELP_INFO: 'info: describe the selected module.',
    HELP_SET: 'set TECHNIQUE <id>: choose a technique you hold. RHOSTS and RPORT come from the module.',
    HELP_UNSET: 'unset TECHNIQUE: clear the technique.',
    HELP_SESSIONS: 'sessions: list the sessions you hold.',
    HELP_BACK: 'back: leave the selected module.',
    HELP_SHOW_SHELL: 'show: list what is on this network.',
    HELP_SHOW_MSF: 'show options: list the module options.',
    HELP_CLEAR: 'clear: clear the screen.',
    HELP_EXIT: 'exit: leave this console (quit is the same).',
    HELP_PANELS: 'panels: switch to the Panels look.',
    HELP_HELP: 'help [verb]: list the commands, or describe one.',
    HELP_MSFCONSOLE: 'msfconsole: start the framework console.',
    HELP_NMAP: 'nmap: the scanner. Type help nmap for its flags.'
});

/** Every fixed answer and note this grammar can return (templates keep `<...>` markers). */
export const GRAMMAR_TEXT = Object.freeze(Object.values(T));

const fill = (template, values = {}) => template.replace(/<([a-z]+)>/g, (m, k) => (k in values ? String(values[k]) : m));
const message = (...lines) => ({ kind: 'message', lines });

// ---------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------

const MAX_LINE = 1000;
const norm = (s) => String(s ?? '').toLowerCase();
const isObj = (o) => o !== null && typeof o === 'object';
const str = (v) => (typeof v === 'string' && v !== '' ? v : null);
const plain = (rows) => (Array.isArray(rows) ? rows : []).filter(r => isObj(r) && typeof r.id === 'string' && r.id !== '');
const unique = (list) => [...new Set(list)];
const joinIds = (ids) => {
    const list = unique(ids);
    return list.length > 20 ? `${list.slice(0, 20).join(', ')}, ...` : list.join(', ');
};
/** Printable echo of a typed flag: no control characters, short. */
const safeEcho = (s) => String(s).replace(/[^ -~]/g, '?').slice(0, 20);

const SHELL_MODE = Object.freeze({ prompt: 'shell', module: null, technique: null });

function normMode(mode) {
    return {
        prompt: mode?.prompt === 'msf' ? 'msf' : 'shell',
        module: str(mode?.module),
        technique: str(mode?.technique)
    };
}
const sameMode = (a, b) => a.prompt === b.prompt && a.module === b.module && a.technique === b.technique;

// ---------------------------------------------------------------------------------------------
// What the view lists
// ---------------------------------------------------------------------------------------------

/** Blocks and rows of a view, as the offers see them: { nets, rows }. */
function collectView(view) {
    const v = isObj(view) ? view : {};
    const ownId = str(v.network?.id);
    const nets = (Array.isArray(v.networks) ? v.networks : []).filter(b => isObj(b) && typeof b.id === 'string' && b.id !== '')
        .map(b => ({ id: b.id, range: str(b.range) ?? str(b.cli?.range), block: b, down: b.route === 'down', rows: plain(b.hosts) }));
    if (ownId && !nets.some(n => n.id === ownId)) nets.push({ id: ownId, range: null, block: null, down: false, rows: plain(v.hosts) });
    const own = nets.find(n => n.id === ownId && !n.down) || null;
    const rows = [];
    for (const n of nets) for (const row of n.rows) rows.push({ row, block: n.block, down: n.down });
    for (const row of plain(v.hosts)) {
        if (own && own.rows.some(r => r.id === row.id)) continue;
        rows.push({ row, block: own?.block ?? null, down: false });
    }
    return { nets, rows };
}

/** Every listed finding with a typeable alias, once each, in view order: the module list. */
export function modulesOf(view) {
    const { rows } = collectView(view);
    const seen = new Set();
    const out = [];
    for (const e of rows) {
        if (e.down) continue;
        const services = Array.isArray(e.row.services) ? e.row.services : [];
        for (const finding of rowFindings(e.row)) {
            if (seen.has(finding.id)) continue;
            seen.add(finding.id);
            const alias = str(finding.alias);
            if (!alias) continue;
            const service = services.find(s => s && s.name === finding.service) || { name: finding.service };
            out.push({ number: out.length + 1, findingId: finding.id, alias, finding, row: e.row, service, module: findingCli(finding, service).module });
        }
    }
    return out.map((m, i) => ({ ...m, number: i + 1 }));
}

// ---------------------------------------------------------------------------------------------
// Resolving a typed word
// ---------------------------------------------------------------------------------------------

/**
 * One typed word against a list of entities { ids, exacts, offered, label, status() }.
 * Order: an exact match among the offered, then an exact match among the listed but not offered
 * (its status text), then a unique prefix among the offered (`ids` only; `exacts` match whole).
 */
function resolveWord(token, ents) {
    const t = norm(token);
    const exact = (e) => e.ids.some(k => norm(k) === t) || (e.exacts || []).some(k => norm(k) === t);
    const exactOn = ents.filter(e => e.offered && exact(e));
    if (exactOn.length === 1) return { kind: 'one', ent: exactOn[0] };
    if (exactOn.length > 1) return { kind: 'many', list: exactOn };
    const exactOff = ents.filter(e => !e.offered && exact(e));
    if (exactOff.length === 1) return { kind: 'status', ent: exactOff[0] };
    if (exactOff.length > 1) return { kind: 'many', list: exactOff };
    if (t === '') return { kind: 'none' };
    const pre = ents.filter(e => e.offered && e.ids.some(k => norm(k).startsWith(t)));
    if (pre.length === 1) return { kind: 'one', ent: pre[0] };
    if (pre.length > 1) return { kind: 'ambiguous', list: pre };
    return { kind: 'none' };
}

/** The entity, or the message to answer instead. `verbWord` and `names` build the unlisted answer. */
function lookup(token, ents, verbWord, names = null) {
    const r = resolveWord(token, ents);
    if (r.kind === 'one') return { ent: r.ent };
    if (r.kind === 'status') return { msg: message(r.ent.status()) };
    if (r.kind === 'many') return { msg: message(fill(T.MORE_THAN_ONE, { ids: joinIds(r.list.map(e => e.label)) })) };
    if (r.kind === 'ambiguous') return { msg: message(fill(T.COULD_BE, { ids: joinIds(r.list.map(e => e.ids[0])) })) };
    const list = names ?? ents.filter(e => e.offered).map(e => e.ids[0]);
    return { msg: message(list.length ? fill(T.WORKS_ON, { verb: verbWord, ids: joinIds(list) }) : fill(T.NOTHING_TO, { verb: verbWord })) };
}

// ---------------------------------------------------------------------------------------------
// The verbs
// ---------------------------------------------------------------------------------------------

const GAME_VERBS = ['sweep', 'scan', 'confirm', 'signin', 'open', 'look', 'unplug'];
const SHELL_VERBS = Object.freeze([...GAME_VERBS.slice(0, 2), 'check', ...GAME_VERBS.slice(2), 'use', 'nmap', 'msfconsole', 'help', 'show', 'clear', 'exit', 'panels']);
const MSF_VERBS = Object.freeze([...GAME_VERBS, 'nmap', 'check', 'use', 'run', 'search', 'info', 'set', 'unset', 'sessions', 'show', 'back', 'help', 'clear', 'exit', 'panels']);
const ALIASES = Object.freeze({
    shell: Object.freeze({ login: 'signin', connect: 'signin', ls: 'show', run: 'use', quit: 'exit' }),
    msf: Object.freeze({ login: 'signin', connect: 'signin', ls: 'show', exploit: 'run', quit: 'exit' })
});

const verbsOf = (prompt) => (prompt === 'msf' ? MSF_VERBS : SHELL_VERBS);

function editDistance(a, b) {
    const x = a.slice(0, 24);
    const y = b.slice(0, 24);
    let prev = Array.from({ length: y.length + 1 }, (_, i) => i);
    for (let i = 1; i <= x.length; i++) {
        const cur = [i];
        for (let j = 1; j <= y.length; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
        }
        prev = cur;
    }
    return prev[y.length];
}

/** A typed verb to its canonical verb: { verb } or { msg }. */
function resolveVerb(token, prompt, { allowNmap = false } = {}) {
    const t = norm(token);
    const verbs = allowNmap && !verbsOf(prompt).includes('nmap') ? [...verbsOf(prompt), 'nmap'] : verbsOf(prompt);
    const aliases = ALIASES[prompt];
    if (verbs.includes(t)) return { verb: t };
    if (Object.prototype.hasOwnProperty.call(aliases, t)) return { verb: aliases[t] };
    const pre = unique([
        ...verbs.filter(v => t !== '' && v.startsWith(t)),
        ...Object.keys(aliases).filter(a => t !== '' && a.startsWith(t)).map(a => aliases[a])
    ]);
    if (pre.length === 1) return { verb: pre[0] };
    if (pre.length > 1) return { msg: message(fill(T.COULD_BE, { ids: pre.join(', ') })) };
    let best = verbs[0];
    let bestD = Infinity;
    for (const v of verbs) {
        const d = editDistance(t, v);
        if (d < bestD) { bestD = d; best = v; }
    }
    return { msg: message(fill(T.UNKNOWN, { verb: best })) };
}

// ---------------------------------------------------------------------------------------------
// State of one parse
// ---------------------------------------------------------------------------------------------

function makeState(offers, view, mode) {
    const listed = collectView(view);
    return {
        offers: Array.isArray(offers) ? offers.filter(isObj) : [],
        view: isObj(view) ? view : {},
        listed,
        mode: normMode(mode),
        prefixed: false,
        modules: modulesOf(view)
    };
}

const offersOf = (st, action) => st.offers.filter(o => o.action === action);
const rowEntry = (st, id) => st.listed.rows.filter(e => e.row.id === id);

function offerResult(st, offer, notes = []) {
    if (offer.pending) return message(T.WAITING);
    return { kind: 'offer', offer, notes: notes.slice() };
}

/** The status sentence of a host row for a verb that has no offer. */
function hostStatus(verb, e) {
    const { row } = e;
    if (e.down || e.block?.route === 'down') return NO_ROUTE_TEXT;
    if (row.responding === false) return NOT_RESPONDING_TEXT;
    const action = row.kind === 'pc' ? hostAction(row) : null;
    const id = row.id;
    if (verb === 'signin') {
        if (action === 'off') return REMOTE_OFF_TEXT;
        if (action === 'open') return fill(T.HAVE_SESSION, { host: id });
    }
    if (verb === 'open') {
        if (action === 'off') return REMOTE_OFF_TEXT;
        if (action === 'locked') return fill(T.LOCKED_SESSION, { host: id });
        return fill(T.NO_SESSION, { host: id });
    }
    if (verb === 'check' && row.scanned !== true) return fill(T.SCAN_FIRST, { host: id });
    return refusalText('not_needed');
}

/** The status sentence of a resource row for a verb that has no offer. */
function resourceStatus(verb, row) {
    const action = resourceAction(row);
    if (action === 'locked') return SHARE_LOCKED_TEXT;
    if (verb === 'open') return fill(T.USE_LOOK, { id: row.id });
    return fill(T.USE_OPEN, { id: row.id });
}

/** The status sentence of a listed finding that has no offer for a verb. */
function findingStatus(st, f) {
    const e = rowEntry(st, f.row.id)[0];
    if (e && (e.down || e.block?.route === 'down')) return NO_ROUTE_TEXT;
    if (f.row.responding === false) return NOT_RESPONDING_TEXT;
    if (f.finding.status === 'confirmed') return refusalText('not_needed');
    if (f.finding.status === 'false') return refusalText('false_positive');
    return T.NOT_ON_OFFER;
}

// ---------------------------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------------------------

function hostEnts(st, verb, action, kinds) {
    const ents = [];
    for (const e of st.listed.rows) {
        const { row } = e;
        if (!kinds(row)) continue;
        const offer = st.offers.find(o => o.action === action && (o.ids?.hostId === row.id || o.ids?.resourceId === row.id));
        const exacts = str(row.address) ? [row.address] : [];
        ents.push({
            ids: [row.id], exacts, offered: !!offer, offer, row, label: `${CONTROLS[action].verb} ${row.id}`,
            status: () => [isHostRow(row) ? hostStatus(verb, e) : resourceStatus(verb, row)]
        });
    }
    return ents;
}

function networkEnts(st) {
    return st.listed.nets.map(n => {
        const offer = st.offers.find(o => o.action === 'sweep' && o.ids?.networkId === n.id);
        return {
            ids: [n.id], exacts: n.range ? [n.range] : [], offered: !!offer, offer, net: n, label: `sweep ${n.id}`,
            status: () => [n.down ? NO_ROUTE_TEXT : T.NO_NETWORK]
        };
    });
}

function findingEnts(st, action) {
    const ents = [];
    const seen = new Set();
    for (const e of st.listed.rows) {
        for (const finding of rowFindings(e.row)) {
            const alias = str(finding.alias);
            if (!alias || seen.has(finding.id)) continue;
            const hit = findFinding(st.view, alias);
            if (!hit || hit.finding.id !== finding.id) continue;
            seen.add(finding.id);
            const f = { finding, row: e.row };
            const offer = action === 'confirm' ? st.offers.find(o => o.action === 'confirm' && o.ids?.findingId === finding.id) : null;
            ents.push({
                ids: [alias], exacts: [], offered: action === 'confirm' ? !!offer : true, offer, f,
                label: `${action} ${alias}`, status: () => [findingStatus(st, f)]
            });
        }
    }
    return ents;
}

function techniqueEnts(st) {
    return techniqueList(st.view).map(t => ({ ids: [t.id], exacts: [], offered: true, label: t.id, tech: t, status: () => [T.NOT_ON_OFFER] }));
}

function moduleEnts(st) {
    return st.modules.map(m => ({ ids: [m.module, m.alias], exacts: [String(m.number)], offered: true, label: m.alias, m, status: () => [T.NO_MODULE] }));
}

const heldIds = (st) => techniqueList(st.view).map(t => t.id);

// ---------------------------------------------------------------------------------------------
// commandFor and helpFor
// ---------------------------------------------------------------------------------------------

/** The Terminal line for an offer (a line `parse` reads back to the same offer). */
export function commandFor(offer, view) {
    const o = offer || {};
    const ids = o.ids || {};
    const verb = CONTROLS[o.action]?.verb;
    switch (o.action) {
        case 'sweep': {
            const net = collectView(view).nets.find(n => n.id === ids.networkId);
            return `nmap -sn ${net?.range ?? ids.networkId}`;
        }
        case 'scan': return `nmap -sV ${ids.hostId}`;
        case 'check': {
            const row = collectView(view).rows.find(e => e.row.id === ids.hostId)?.row;
            const service = (Array.isArray(row?.services) ? row.services : []).find(s => s && s.name === ids.service);
            const udp = service && serviceCli(service).protocol === 'udp';
            const port = service && service.port !== undefined && service.port !== null ? ` -p ${service.port}` : '';
            return `nmap -sV --script vuln${udp ? ' -sU' : ''}${port} ${ids.hostId}`;
        }
        case 'confirm': {
            const m = modulesOf(view).find(x => x.findingId === ids.findingId);
            return m ? `msf > use ${m.module}; check` : null;
        }
        case 'use': {
            const m = modulesOf(view).find(x => x.findingId === ids.findingId);
            return m ? `msf > use ${m.module}; set TECHNIQUE ${ids.techniqueId}; run` : null;
        }
        case 'sign-in': return `${verb} ${ids.hostId}`;
        case 'open': return `${verb} ${ids.hostId ?? ids.resourceId}`;
        case 'observe': return `${verb} ${ids.resourceId}`;
        case 'unplug': return verb;
        default: return null;
    }
}

/** The help text for a verb (or the whole list for null) in a mode: an array of lines. */
export function helpFor(verb, mode) {
    const prompt = normMode(mode).prompt;
    const v = verb === null || verb === undefined || verb === '' ? null : String(verb);
    const game = (action) => `${CONTROLS[action].verb}: ${CONTROLS[action].title}`;
    const byVerb = {
        sweep: game('sweep'), scan: game('scan'), confirm: game('confirm'),
        signin: game('sign-in'), open: game('open'), look: game('observe'), unplug: game('unplug'),
        check: prompt === 'msf' ? T.HELP_CHECK_MSF : T.HELP_CHECK_SHELL,
        use: prompt === 'msf' ? T.HELP_USE_MSF : T.HELP_USE_SHELL,
        run: T.HELP_RUN, search: T.HELP_SEARCH, info: T.HELP_INFO, set: T.HELP_SET, unset: T.HELP_UNSET,
        sessions: T.HELP_SESSIONS, back: T.HELP_BACK, show: prompt === 'msf' ? T.HELP_SHOW_MSF : T.HELP_SHOW_SHELL,
        clear: T.HELP_CLEAR, exit: T.HELP_EXIT, panels: T.HELP_PANELS, help: T.HELP_HELP,
        msfconsole: T.HELP_MSFCONSOLE, nmap: T.HELP_NMAP
    };
    if (v === null) {
        return [prompt === 'msf' ? T.HELP_HEAD_MSF : T.HELP_HEAD_SHELL, ...verbsOf(prompt).map(x => byVerb[x])];
    }
    if (v === 'nmap') return [T.HELP_NMAP_FORMS, T.HELP_NMAP_VALUE, T.HELP_NMAP_KNOWN];
    return byVerb[v] ? [byVerb[v]] : [];
}

// ---------------------------------------------------------------------------------------------
// The game verbs
// ---------------------------------------------------------------------------------------------

function needNoMore(args) { return args.length > 0 ? message(T.ONE_TARGET) : null; }

function sweepListed(net) {
    return { kind: 'local', name: 'sweep.listed', args: { networkId: net.id, block: net.block, rows: net.rows } };
}

function doSweep(st, args) {
    if (args.length > 1) return message(T.ONE_TARGET);
    const ents = networkEnts(st);
    if (!args.length) {
        const on = ents.filter(e => e.offered);
        if (on.length === 1) return offerResult(st, on[0].offer);
        if (on.length > 1) return message(fill(T.NAME_NETWORK, { ids: joinIds(on.map(e => e.ids[0])) }));
        const up = ents.filter(e => !e.net.down);
        if (up.length === 1) return sweepListed(up[0].net);
        return message(up.length ? fill(T.NAME_NETWORK, { ids: joinIds(up.map(e => e.ids[0])) }) : T.NO_NETWORK);
    }
    const hit = networkTarget(args[0], ents);
    if (hit?.listed) return sweepListed(hit.listed);
    if (hit?.msg) return hit.msg;
    const r = lookup(args[0], ents, 'sweep');
    if (r.msg) return r.msg;
    return offerResult(st, r.ent.offer);
}

/** A word that names a listed block with no sweep on offer: { listed } (or { msg } when it is down). */
function networkTarget(token, ents) {
    const r = resolveWord(token, ents);
    if (r.kind !== 'status' || !r.ent.net) return null;
    return r.ent.net.down ? { msg: message(NO_ROUTE_TEXT) } : { listed: r.ent.net };
}

function doHostVerb(st, verb, action, args, kinds) {
    if (args.length > 1) return message(T.ONE_TARGET);
    const ents = hostEnts(st, verb, action, kinds);
    if (!args.length) {
        const names = ents.filter(e => e.offered).map(e => e.ids[0]);
        return message(names.length ? fill(T.WORKS_ON, { verb, ids: joinIds(names) }) : fill(T.NOTHING_TO, { verb }));
    }
    const r = lookup(args[0], ents, verb);
    if (r.msg) return r.msg;
    return offerResult(st, r.ent.offer);
}

const isPc = (row) => row.kind === 'pc';
const isOpenable = (row) => row.kind === 'pc' || row.kind === 'file_share';
const isResource = (row) => !isHostRow(row);

/** The services of one host the check offers cover: entities for the service operand. */
function serviceEnts(st, hostId) {
    const row = rowEntry(st, hostId)[0]?.row;
    const raw = Array.isArray(row?.services) ? row.services : [];
    return offersOf(st, 'check').filter(o => o.ids?.hostId === hostId).map(o => {
        const s = raw.find(x => x && x.name === o.ids.service) || {};
        const port = s.port !== undefined && s.port !== null ? String(s.port) : null;
        return { ids: [o.ids.service], exacts: port ? [port] : [], offered: true, offer: o, port, service: s, label: `check ${hostId} ${o.ids.service}`, status: () => [T.NOT_ON_OFFER] };
    });
}

function doCheck(st, args) {
    if (args.length > 2) return message(T.ONE_TARGET);
    const hostEntsAll = hostEnts(st, 'check', 'check', isHostRow);
    // a host with check offers counts as offered whatever the first of them is
    for (const e of hostEntsAll) e.offered = serviceEnts(st, e.row.id).length > 0;
    if (!args.length) {
        const names = hostEntsAll.filter(e => e.offered).map(e => e.ids[0]);
        return message(names.length ? fill(T.WORKS_ON, { verb: 'check', ids: joinIds(names) }) : fill(T.NOTHING_TO, { verb: 'check' }));
    }
    const r = lookup(args[0], hostEntsAll, 'check');
    if (r.msg) return r.msg;
    const services = serviceEnts(st, r.ent.row.id);
    if (args.length === 1) {
        if (services.length === 1) return offerResult(st, services[0].offer);
        return message(`${T.NAME_SERVICE} ${joinIds(services.map(s => (s.port ? `${s.ids[0]} (${s.port})` : s.ids[0])))}`);
    }
    const s = lookup(args[1], services, 'check', services.map(x => x.ids[0]));
    if (s.msg) return s.msg;
    return offerResult(st, s.ent.offer);
}

function doConfirm(st, args) {
    if (args.length > 1) return message(T.ONE_TARGET);
    const ents = findingEnts(st, 'confirm');
    if (!args.length) {
        const names = ents.filter(e => e.offered).map(e => e.ids[0]);
        return message(names.length ? fill(T.WORKS_ON, { verb: 'confirm', ids: joinIds(names) }) : fill(T.NOTHING_TO, { verb: 'confirm' }));
    }
    const r = lookup(args[0], ents, 'confirm');
    if (r.msg) return r.msg;
    return offerResult(st, r.ent.offer);
}

function useOfferFor(st, techniqueId, findingId) {
    return st.offers.find(o => o.action === 'use' && o.ids?.techniqueId === techniqueId && o.ids?.findingId === findingId) || null;
}

function doUseGame(st, args) {
    let a = args.slice();
    if (a.length === 3 && norm(a[1]) === 'on') a = [a[0], a[2]];
    if (a.length > 2) return message(T.ONE_TARGET);
    if (a.length < 2) return message(T.USE_FORM);
    const techs = techniqueEnts(st);
    const t = lookup(a[0], techs, 'use', techs.map(x => x.ids[0]));
    if (t.msg) {
        const held = techs.map(x => x.ids[0]);
        return message(held.length ? fill(T.TECHNIQUES_HELD, { ids: joinIds(held) }) : T.HOLD_NONE);
    }
    const fs = lookup(a[1], findingEnts(st, 'use'), 'use');
    if (fs.msg) return fs.msg;
    const offer = useOfferFor(st, t.ent.tech.id, fs.ent.f.finding.id);
    if (!offer) return message(findingStatus(st, fs.ent.f));
    return offerResult(st, offer);
}

function doUnplug(st, args) {
    if (args.length) return message(T.ONE_TARGET);
    const o = offersOf(st, 'unplug')[0];
    return o ? offerResult(st, o) : message(T.NO_UNPLUG);
}

// ---------------------------------------------------------------------------------------------
// The scanner form
// ---------------------------------------------------------------------------------------------

const VALUE_FLAGS = Object.freeze(['-p', '--script', '-oN', '-oX', '-oG', '-oA', '--top-ports', '--min-rate', '--max-retries', '-e']);
const KNOWN_FLAGS = Object.freeze(['-sS', '-sT', '-sU', '-sV', '-sC', '-A', '-O', '-Pn', '-n', '-v', '-vv', '-T0', '-T1', '-T2', '-T3', '-T4', '-T5', '-sn']);

function doNmap(st, args) {
    const notes = [];
    const flags = new Set();
    let portValue = null;
    let script = false;
    const targets = [];
    for (let i = 0; i < args.length; i++) {
        const tok = args[i];
        if (tok === '-iL' || tok.startsWith('-iL=')) return message(T.NMAP_FILE);
        if (tok.startsWith('-')) {
            const eq = tok.indexOf('=');
            const name = tok.startsWith('--') && eq > 0 ? tok.slice(0, eq) : tok;
            if (VALUE_FLAGS.includes(name)) {
                let value = tok.startsWith('--') && eq > 0 ? tok.slice(eq + 1) : null;
                if (value === null && i + 1 < args.length) value = args[++i];
                if (name === '-p') portValue = value;
                if (name === '--script') script = true;
                continue;
            }
            if (name === '-p' || (name.startsWith('-p') && /^-p[\d,-]+$/.test(name))) {
                portValue = name.slice(2) || null;
                continue;
            }
            if (KNOWN_FLAGS.includes(name)) { flags.add(name); continue; }
            notes.push(fill(T.NMAP_IGNORED, { flag: safeEcho(tok) }));
            continue;
        }
        targets.push(tok);
    }
    if (targets.length > 1) return message(T.ONE_TARGET);
    if (!targets.length) return message(T.NMAP_NO_TARGET);

    // The network and the host entities together, so a shared word gives the both-matches answer
    const nets = networkEnts(st);
    const action = script ? 'check' : 'scan';
    const hosts = hostEnts(st, script ? 'check' : 'scan', action, isHostRow);
    if (script) for (const e of hosts) e.offered = serviceEnts(st, e.row.id).length > 0;
    for (const e of hosts) e.isHost = true;
    const r = lookup(targets[0], [...nets, ...hosts], script ? 'check' : 'scan',
        unique([...nets.filter(e => e.offered).map(e => e.ids[0]), ...hosts.filter(e => e.offered).map(e => e.ids[0])]));
    if (r.msg) {
        // A listed block with no sweep on offer answers with its hosts
        const hit = networkTarget(targets[0], [...nets, ...hosts]);
        if (hit?.listed) return sweepListed(hit.listed);
        return r.msg;
    }
    const ent = r.ent;
    if (!ent.isHost) {
        if (['-sV', '-sS', '-sT', '-A'].some(f => flags.has(f))) notes.push(T.NMAP_VERSIONS);
        return offerResult(st, ent.offer, notes);
    }
    if (flags.has('-sn')) return message(T.NMAP_SN_HOST);
    if (!script) {
        if (portValue !== null) notes.push(T.NMAP_P_IGNORED);
        return offerResult(st, ent.offer, notes);
    }
    const services = serviceEnts(st, ent.row.id);
    const portList = () => message(`${T.NAME_PORT} ${joinIds(services.map(s => s.port ?? s.ids[0]))}`);
    let chosen;
    if (portValue !== null) {
        const hits = services.filter(s => s.port !== null && s.port === String(portValue).trim());
        if (hits.length === 0) return portList();
        if (hits.length > 1) return message(fill(T.MORE_THAN_ONE, { ids: joinIds(hits.map(h => h.label)) }));
        chosen = hits[0];
    } else if (services.length === 1) {
        chosen = services[0];
    } else {
        return services.length ? portList() : message(fill(T.NO_SERVICES, { host: ent.row.id }));
    }
    const protocol = serviceCli(chosen.service).protocol;
    if ((flags.has('-sU') ? 'udp' : 'tcp') !== protocol && (flags.has('-sU') || protocol === 'udp')) {
        notes.push(fill(T.NMAP_PROTOCOL, { port: chosen.port ?? chosen.ids[0], protocol }));
    }
    return offerResult(st, chosen.offer, notes);
}

// ---------------------------------------------------------------------------------------------
// The framework form
// ---------------------------------------------------------------------------------------------

const currentModule = (st) => (st.mode.module ? st.modules.find(m => m.findingId === st.mode.module) || null : null);

function doModuleUse(st, args) {
    if (args.length > 1) return message(T.ONE_TARGET);
    if (!args.length) return message(T.SELECT_MODULE);
    const r = lookup(args[0], moduleEnts(st), 'use', []);
    if (r.msg) return message(T.NO_MODULE);
    const m = r.ent.m;
    st.mode = { ...st.mode, module: m.findingId };
    return { kind: 'local', name: 'msf.use', args: { findingId: m.findingId, alias: m.alias, module: m.module }, mode: { ...st.mode } };
}

function doModuleCheck(st, args) {
    if (args.length) return message(T.ONE_TARGET);
    const m = currentModule(st);
    if (!m) return message(T.SELECT_MODULE);
    const offer = st.offers.find(o => o.action === 'confirm' && o.ids?.findingId === m.findingId);
    if (!offer) return message(findingStatus(st, { finding: m.finding, row: m.row }));
    return offerResult(st, offer);
}

function doRun(st, args) {
    if (args.length) return message(T.ONE_TARGET);
    const m = currentModule(st);
    if (!m) return message(T.SELECT_MODULE);
    const held = heldIds(st);
    if (!st.mode.technique || !held.includes(st.mode.technique)) {
        return message(fill(T.SET_TECHNIQUE, { ids: held.length ? held.join(', ') : 'none' }));
    }
    const offer = useOfferFor(st, st.mode.technique, m.findingId);
    if (!offer) return message(findingStatus(st, { finding: m.finding, row: m.row }));
    return offerResult(st, offer);
}

function doInfo(st, args) {
    if (args.length) return message(T.ONE_TARGET);
    const m = currentModule(st);
    if (!m) return message(T.SELECT_MODULE);
    return { kind: 'local', name: 'msf.info', args: { findingId: m.findingId, alias: m.alias } };
}

function doShowMsf(st, args) {
    if (args.length > 1) return message(T.ONE_TARGET);
    const w = norm(args[0] ?? '');
    if (w === '' || !'options'.startsWith(w)) return message(T.NOT_PART);
    const m = currentModule(st);
    if (!m) return message(T.SELECT_MODULE);
    return { kind: 'local', name: 'msf.options', args: { findingId: m.findingId, alias: m.alias } };
}

function optionName(name) {
    const n = norm(name);
    if (n === 'technique') return 'TECHNIQUE';
    if (n === 'rhosts' || n === 'rport') return 'RHOSTS_RPORT';
    return null;
}

function doSet(st, args) {
    if (args.length > 2) return message(T.ONE_TARGET);
    const name = optionName(args[0] ?? '');
    if (name === 'RHOSTS_RPORT') return message(T.RHOSTS_RPORT);
    if (name !== 'TECHNIQUE') return message(T.NO_OPTION);
    const techs = techniqueEnts(st);
    const held = techs.map(x => x.ids[0]);
    const noneMsg = message(held.length ? fill(T.TECHNIQUE_HELD, { ids: joinIds(held) }) : T.HOLD_NONE);
    if (args.length < 2) return noneMsg;
    const r = resolveWord(args[1], techs);
    if (r.kind !== 'one') return noneMsg;
    st.mode = { ...st.mode, technique: r.ent.tech.id };
    return { kind: 'local', name: 'msf.set', args: { name: 'TECHNIQUE', value: r.ent.tech.id }, mode: { ...st.mode } };
}

function doUnset(st, args) {
    if (args.length > 1) return message(T.ONE_TARGET);
    const name = optionName(args[0] ?? '');
    if (name === 'RHOSTS_RPORT') return message(T.RHOSTS_RPORT);
    if (name !== 'TECHNIQUE') return message(T.NO_OPTION);
    st.mode = { ...st.mode, technique: null };
    return { kind: 'local', name: 'msf.unset', args: { name: 'TECHNIQUE' }, mode: { ...st.mode } };
}

// ---------------------------------------------------------------------------------------------
// One command
// ---------------------------------------------------------------------------------------------

function doHelp(st, args) {
    if (args.length > 1) return message(T.ONE_TARGET);
    if (!args.length) return { kind: 'local', name: 'help', args: { verb: null } };
    const r = resolveVerb(args[0], st.mode.prompt, { allowNmap: true });
    if (r.msg) return r.msg;
    return { kind: 'local', name: 'help', args: { verb: r.verb } };
}

function runCommand(tokens, st) {
    const first = resolveVerb(tokens[0], st.mode.prompt);
    if (first.msg) return first.msg;
    const verb = first.verb;
    const args = tokens.slice(1);
    const msf = st.mode.prompt === 'msf';
    switch (verb) {
        case 'sweep': return doSweep(st, args);
        case 'scan': return doHostVerb(st, 'scan', 'scan', args, isHostRow);
        case 'signin': return doHostVerb(st, 'signin', 'sign-in', args, isPc);
        case 'open': return doHostVerb(st, 'open', 'open', args, isOpenable);
        case 'look': return doHostVerb(st, 'look', 'observe', args, isResource);
        case 'confirm': return doConfirm(st, args);
        case 'unplug': return doUnplug(st, args);
        case 'check': return msf ? doModuleCheck(st, args) : doCheck(st, args);
        case 'use': return msf ? doModuleUse(st, args) : doUseGame(st, args);
        case 'run': return doRun(st, args);
        case 'nmap': return doNmap(st, args);
        case 'search': return { kind: 'local', name: 'msf.search', args: { word: args.join(' ') } };
        case 'info': return doInfo(st, args);
        case 'set': return doSet(st, args);
        case 'unset': return doUnset(st, args);
        case 'sessions': return needNoMore(args) || { kind: 'local', name: 'msf.sessions', args: {} };
        case 'show': return msf ? doShowMsf(st, args) : (needNoMore(args) || { kind: 'local', name: 'show', args: {} });
        case 'back': {
            if (args.length) return message(T.ONE_TARGET);
            st.mode = { ...st.mode, module: null };
            return { kind: 'local', name: 'back', args: {}, mode: { ...st.mode } };
        }
        case 'msfconsole': {
            if (args.length) return message(T.ONE_TARGET);
            st.mode = { prompt: 'msf', module: null, technique: null };
            return { kind: 'local', name: 'msfconsole', args: {}, mode: { ...st.mode } };
        }
        case 'exit': {
            if (args.length) return message(T.ONE_TARGET);
            if (!msf) return { kind: 'local', name: 'exit', args: {} };
            st.mode = { ...SHELL_MODE };
            return { kind: 'local', name: 'exit', args: {}, mode: { ...st.mode } };
        }
        case 'clear': return needNoMore(args) || { kind: 'local', name: 'clear', args: {} };
        case 'panels': return needNoMore(args) || { kind: 'local', name: 'panels', args: {} };
        case 'help': return doHelp(st, args);
        default: return message(T.NOT_PART);
    }
}

// ---------------------------------------------------------------------------------------------
// parse
// ---------------------------------------------------------------------------------------------

const PROMPT_MSF = /^msf\s*(?:\(([^)]*)\)\s*)?>\s*/i;
const REDIRECTS = new Set(['|', '>', '>>', '<']);
const STATE_ONLY = new Set(['msf.use', 'msf.set', 'msf.unset', 'back']);

function parseInner(line, offers, view, mode) {
    const startMode = normMode(mode);
    const st = makeState(offers, view, startMode);
    let text = String(line ?? '').replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ');
    if (text.length > MAX_LINE) return message(T.TOO_LONG);
    text = text.trim();

    if (text.startsWith('$')) {
        st.prefixed = true;
        st.mode = { ...SHELL_MODE };
        text = text.slice(1).trim();
    } else {
        const m = PROMPT_MSF.exec(text);
        if (m) {
            st.prefixed = true;
            st.mode = { prompt: 'msf', module: null, technique: null };
            const named = (m[1] || '').trim();
            text = text.slice(m[0].length).trim();
            if (named) {
                const hit = st.modules.find(x => norm(x.module) === norm(named) || norm(x.alias) === norm(named));
                if (!hit) return message(T.NO_MODULE);
                st.mode.module = hit.findingId;
            }
        }
    }
    const words = text.split(/\s+/).filter(Boolean);
    if (words.some(w => REDIRECTS.has(w))) return message(T.PIPES);

    const results = [];
    let offerCount = 0;
    for (const segment of text.split(';')) {
        const tokens = segment.split(/\s+/).filter(Boolean);
        if (!tokens.length) continue;
        const r = runCommand(tokens, st);
        if (r.kind === 'message') return r;
        if (r.kind === 'offer' && ++offerCount > 1) return message(T.ONE_ACTION);
        results.push(r);
    }
    if (!results.length) return message();

    const offerIndex = results.findIndex(r => r.kind === 'offer');
    let final;
    let before;
    if (offerIndex >= 0) {
        final = results[offerIndex];
        before = results.filter((r, i) => i !== offerIndex && !STATE_ONLY.has(r.name));
    } else {
        final = results[results.length - 1];
        before = results.slice(0, -1);
    }
    const out = { ...final };
    delete out.mode;
    if (before.length) out.before = before.map(r => { const c = { ...r }; delete c.mode; return c; });
    if (!st.prefixed) {
        if (!sameMode(st.mode, startMode)) out.mode = { ...st.mode };
        else if (final.mode) out.mode = { ...final.mode };
    }
    return out;
}

/**
 * What a typed line means, against the current offer list. Never throws; a line it cannot read
 * answers with a message. `mode` is { prompt, module, technique }.
 */
export function parse(line, offers, view, mode) {
    try {
        return parseInner(line, offers, view, mode);
    } catch (err) {
        return message(T.NOT_PART);
    }
}

// ---------------------------------------------------------------------------------------------
// complete
// ---------------------------------------------------------------------------------------------

const FLAG_WORDS = Object.freeze([...VALUE_FLAGS, ...KNOWN_FLAGS, '-iL']);

function argumentCandidates(st, verb, index, before) {
    const names = (ents) => ents.filter(e => e.offered).map(e => e.ids[0]);
    switch (verb) {
        case 'sweep': return index === 0 ? names(networkEnts(st)) : [];
        case 'scan': return index === 0 ? names(hostEnts(st, 'scan', 'scan', isHostRow)) : [];
        case 'signin': return index === 0 ? names(hostEnts(st, 'signin', 'sign-in', isPc)) : [];
        case 'open': return index === 0 ? names(hostEnts(st, 'open', 'open', isOpenable)) : [];
        case 'look': return index === 0 ? names(hostEnts(st, 'look', 'observe', isResource)) : [];
        case 'confirm': return index === 0 ? names(findingEnts(st, 'confirm')) : [];
        case 'check': {
            if (st.mode.prompt === 'msf') return [];
            if (index === 0) return unique(offersOf(st, 'check').map(o => o.ids.hostId));
            return index === 1 ? serviceEnts(st, before[0]).map(s => s.ids[0]) : [];
        }
        case 'use': {
            if (st.mode.prompt === 'msf') return index === 0 ? st.modules.flatMap(m => [m.module, m.alias]) : [];
            if (index === 0) return heldIds(st);
            if (index === 1) return ['on', ...findingEnts(st, 'use').map(e => e.ids[0])];
            return index === 2 ? findingEnts(st, 'use').map(e => e.ids[0]) : [];
        }
        case 'nmap': return unique([...names(networkEnts(st)), ...names(hostEnts(st, 'scan', 'scan', isHostRow))]);
        case 'set': case 'unset': return index === 0 ? ['TECHNIQUE'] : (index === 1 && verb === 'set' ? heldIds(st) : []);
        case 'show': return index === 0 && st.mode.prompt === 'msf' ? ['options'] : [];
        case 'help': return index === 0 ? [...verbsOf(st.mode.prompt), 'nmap'] : [];
        default: return [];
    }
}

/**
 * Completion of the token at the end of `line`: `{ completed, matches }`. `matches` are the
 * candidates that start with the token; `completed` is the line with the token extended to their
 * longest common prefix (a lone match also gets a trailing space), or the line unchanged.
 */
export function complete(line, offers, view, mode) {
    const text = String(line ?? '').replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ');
    const none = { completed: text, matches: [] };
    try {
        if (text.length > MAX_LINE) return none;
        const st = makeState(offers, view, mode);
        const semi = text.lastIndexOf(';');
        let seg = text.slice(semi + 1);
        if (semi < 0) {
            const lead = /^\s*\$/.exec(seg) || PROMPT_MSF.exec(seg.trimStart());
            if (lead) {
                if (/^\s*\$/.test(seg)) st.mode = { ...SHELL_MODE }; else st.mode = { prompt: 'msf', module: null, technique: null };
                seg = /^\s*\$/.test(seg) ? seg.replace(/^\s*\$/, '') : seg.trimStart().slice(lead[0].length);
            }
        }
        const pieces = seg.split(/\s+/);
        const token = pieces[pieces.length - 1];
        const done = pieces.slice(0, -1).filter(Boolean);
        let candidates;
        if (!done.length) {
            const aliases = Object.keys(ALIASES[st.mode.prompt]);
            candidates = [...verbsOf(st.mode.prompt), ...aliases];
        } else {
            const v = resolveVerb(done[0], st.mode.prompt);
            if (v.msg) return none;
            const rest = done.slice(1);
            candidates = token.startsWith('-') && v.verb === 'nmap' ? FLAG_WORDS : argumentCandidates(st, v.verb, rest.length, rest);
        }
        const t = norm(token);
        const matches = unique(candidates.filter(c => norm(c).startsWith(t))).sort();
        if (!matches.length) return none;
        let prefix = matches[0];
        for (const m of matches) {
            let i = 0;
            while (i < prefix.length && i < m.length && norm(prefix[i]) === norm(m[i])) i++;
            prefix = prefix.slice(0, i);
        }
        const head = text.slice(0, text.length - token.length);
        if (matches.length === 1) return { completed: `${head}${matches[0]} `, matches };
        return { completed: prefix.length > token.length ? `${head}${prefix}` : text, matches };
    } catch (err) {
        return none;
    }
}
