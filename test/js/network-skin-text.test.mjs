// The same words in both skins (Ops S6 unit 17, test 9), driven with the real scene and both real renderers.
//
// One fixture whose every text field is a unique marker is opened in Panels and in the Terminal and put through
// one sequence: the opening render; each offer in offers() order with the same fake answer; a refetch after each;
// one refusal per code and one `already` per ops route; an unplug held and then refused; a null answer for each
// of sweep, scan, check, confirm, use and unplug. At every step two things are compared:
//   result: what the move newly showed (the Terminal's new log lines, less the echo and `started` lines, and its
//           new quick commands; Panels' new pieces and toasts) in each skin;
//   state:  after the refetch, the whole of Panels against the Terminal's `show` output and quick commands.
// A piece is the whole textContent of an element with a non-blank direct text node, a control's title, or an
// aria-label on a textless element; hidden elements give none; white space is collapsed, case kept.
//
// The Terminal prints a table row as one span per cell, and a sentence as several spans, where Panels draw one
// element. So a Panels piece is found in the Terminal either as a span or as the joined text of a run of
// neighbouring spans of one line. Run with: node test/js/network-skin-text.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mount, settle, imp, model } from './support/network-view-harness.mjs';

const NV = 'minigames/network-view/';
const FMT = await imp(`${NV}terminal-format.js`);
const CONTROLS = (await imp(`${NV}view-controls.js`)).CONTROLS;
const choice = await imp(`${NV}skin-choice.js`);
const DEFAULTS = await imp(`${NV}cli-gen/defaults.js`);
const here = dirname(fileURLToPath(import.meta.url));
const CODES = JSON.parse(readFileSync(join(here, '../fixtures/files/ops_refusal_codes.json'), 'utf8'));

const clone = (v) => JSON.parse(JSON.stringify(v));
const collapse = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

// Text only Panels draw: section headings the Terminal replaces with table headers and group lines, and the bar
export const PANELS_ONLY_TEXT = Object.freeze([
    'Computers', 'Devices', 'File shares', 'Printers and devices', 'Phones', 'Other devices', 'Scanning', 'Needs'
]);

// ---------------------------------------------------------------------------------------------
// The fixture: every text field a unique marker
// ---------------------------------------------------------------------------------------------

let counter = 0;
const mk = (field) => `Mk${++counter}${field}`;

/** The world: a view with one of everything an offer can be made on, the held techniques, and the answers. */
function world() {
    const t = {};
    const text = (name) => { t[name] = mk(name); return t[name]; };
    const svc = (name, port) => ({ name, label: text(`svcLabel_${name}`), port, product: text(`product_${name}`), version: text(`version_${name}`) });
    const finding = (id, alias, service, status, extra = {}) => ({
        id, alias, hostId: 'dev_b', service, class: 'default_creds', severity: 'high',
        summary: text(`summary_${alias}`), status, needs: [], ...extra
    });
    const rows = [
        { id: 'pc_a', kind: 'pc', name: text('pcA'), host: text('hostA'), sprite: 'pc_desktop', headless: false, remoteSignIn: true },
        { id: 'pc_b', kind: 'pc', name: text('pcB'), host: text('hostB'), sprite: 'pc_desktop', headless: false, remoteSignIn: true,
            session: { displayName: text('whoB'), username: text('userB'), access: 'admin', via: 'technique' } },
        { id: 'pc_c', kind: 'pc', name: text('pcC'), host: text('hostC'), sprite: 'pc_desktop', headless: false, remoteSignIn: true,
            session: { displayName: text('whoC'), username: text('userC'), locked: true, via: 'login' } },
        { id: 'pc_d', kind: 'pc', name: text('pcD'), host: text('hostD'), sprite: 'pc_desktop', headless: false, remoteSignIn: false },
        { id: 'pc_e', kind: 'pc', name: text('pcE'), host: text('hostE'), sprite: 'pc_desktop', headless: false, remoteSignIn: true, responding: false },
        { id: 'dev_a', kind: 'device', name: text('devA'), sprite: 'pnw_portable_printer1' },
        {
            id: 'dev_b', kind: 'device', name: text('devB'), sprite: 'pnw_portable_printer1', scanned: true,
            services: [svc('web', 80), svc('ftp', 21)],
            findings: [
                finding('dev_b.web.one', 'f1', 'web', 'unconfirmed'),
                finding('dev_b.web.two', 'f2', 'web', 'confirmed', { needs: [{ kind: 'fact', label: text('needMet'), met: true }, { kind: 'item', label: text('needUnmet'), met: false }] }),
                finding('dev_b.ftp.three', 'f3', 'ftp', 'false', { falseBecause: text('falseBecause') }),
                finding('dev_b.ftp.four', 'f4', 'ftp', 'confirmed', { fixed: true, needs: [] })
            ]
        },
        { id: 'share_open', kind: 'file_share', name: text('shareOpen'), host: text('shareHost'), open: true },
        { id: 'share_locked', kind: 'file_share', name: text('shareLocked'), host: text('shareHost2'), open: false },
        { id: 'printer_a', kind: 'printer', name: text('printerA'), observations: text('observationsA') },
        { id: 'phone_a', kind: 'phone', name: text('phoneA') }
    ];
    const far = [];
    const entry = {
        id: 'jack_a', via: 'jack', name: text('footholdName'), itemId: 'netlink_jack_a', sourceId: 'port_a',
        network: { id: 'lab_net', name: text('networkName') },
        hosts: rows,
        networks: [
            { id: 'lab_net', name: text('blockName'), route: 'up', via: null, hosts: rows, swept: true, ops: true },
            { id: 'far_net', name: text('farName'), route: 'up', via: { hostId: 'pc_b', host: text('viaHost'), locked: true }, hosts: far, swept: false, ops: true },
            { id: 'dead_net', name: text('deadName'), route: 'down', hosts: [{ id: 'dead_pc', kind: 'pc', name: text('deadPc'), host: text('deadHost') }] }
        ]
    };
    const card = (id, name) => ({ name: text(`card_${name}`), summary: text(`cardSummary_${name}`), worksOn: { class: 'default_creds', product: text(`cardProduct_${name}`), versions: [text(`cardVersion_${name}`)] }, itemId: `card_${id}` });
    const body = { footholds: [entry], techniques: { t1: card('t1', 'one'), t2: card('t2', 'two') } };
    const message = text('message');
    const grantWho = text('grantWho');
    const needLabel = text('needLabel');
    const unplugMessage = text('unplugMessage');
    const found = { id: 'dev_b.web.five', alias: 'f5', hostId: 'dev_b', service: 'web', class: 'misconfig', severity: 'low', summary: text('summary_f5'), status: 'unconfirmed', needs: [] };
    const answers = {
        sweep: { success: true, network: { id: 'far_net', swept: true, hosts: [
            { id: 'far_pc', kind: 'pc', name: text('farPc'), host: text('farHost'), sprite: 'pc_desktop', headless: false, remoteSignIn: true },
            { id: 'far_dev', kind: 'device', name: text('farDev'), sprite: 'pnw_portable_printer1' }
        ] } },
        scan: { success: true, host: { id: 'dev_a', kind: 'device', name: t.devA, sprite: 'pnw_portable_printer1', scanned: true, services: [svc('smb', 445)] } },
        check: { success: true, hostId: 'dev_b', service: 'web', findings: [found] },
        confirm: { success: true, finding: { ...rows[6].findings[0], status: 'confirmed', needs: [{ kind: 'fact', label: text('confirmNeed'), met: false }] } },
        useSession: { success: true, grant: 'session', session: { displayName: grantWho, username: text('grantUser'), access: 'admin', via: 'technique' }, already: false, endedPcIds: [] },
        useCredential: { success: true, grant: 'credential', keyringChanged: false }
    };
    return { body, t, rows, message, needLabel, unplugMessage, answers };
}

// ---------------------------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------------------------

/** The pieces of a DOM subtree: text of an element with its own text, a title, an aria-label on a textless element. */
function piecesOf(root, { skip = null } = {}) {
    const out = [];
    const walk = (el) => {
        if (el.hidden === true || (skip && skip(el))) return;
        let own = false;
        for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim() !== '') own = true;
        if (own) out.push(collapse(el.textContent));
        // A name wrapped in one nowrap span per word is one piece, not one per word
        const words = [...el.children].filter(c => c.classList?.contains('network-row-word'));
        if (words.length && !own) out.push(collapse(el.textContent));
        const title = el.getAttribute?.('title');
        if (title && title.trim()) out.push(collapse(title));
        const aria = el.getAttribute?.('aria-label');
        if (aria && aria.trim() && collapse(el.textContent) === '') out.push(collapse(aria));
        for (const c of el.children) if (!c.classList?.contains('network-row-word')) walk(c);
    };
    for (const c of root.children) walk(c);
    return out;
}

const counts = (list) => { const m = new Map(); for (const p of list) m.set(p, (m.get(p) || 0) + 1); return m; };
/** What `after` holds that `before` did not, as a multiset difference. */
function added(before, after) {
    const b = counts(before);
    const out = [];
    for (const p of after) {
        const n = b.get(p) || 0;
        if (n > 0) b.set(p, n - 1); else out.push(p);
    }
    return out;
}

const term = (h) => h.view().container.querySelector('.network-term');
const termLines = (h) => [...term(h).querySelectorAll('.network-term-log .network-term-line-out')]
    .map(l => [...l.children].map(s => s.textContent));
const termStrip = (h) => piecesOf(term(h).querySelector('.network-term-list'));
const panelsPieces = (h) => {
    // Panels' own header lines and the list; nothing of the window's title bar or the skin switch
    const header = h.view().container.querySelector('.network-view-header');
    return [...(header ? piecesOf(header) : []), ...piecesOf(h.view().gameContainer)];
};

// ---------------------------------------------------------------------------------------------
// Driving one skin
// ---------------------------------------------------------------------------------------------

const attrOf = (el, a) => el?.getAttribute?.(a) ?? null;

/** The control for an offer in the mounted skin, or null. */
function controlFor(h, offer, w) {
    const root = h.view().container;
    const ids = offer.ids || {};
    const action = offer.action;
    const alias = (fid) => { for (const r of w.rows) for (const f of r.findings || []) if (f.id === fid) return f.alias; return null; };
    const all = [...root.querySelectorAll(action === 'unplug' ? '[data-unplug]' : `[data-action="${action}"]`)];
    if (action === 'unplug') return [...h.view().container.parentNode.querySelectorAll('[data-unplug]')][0] || all[0] || null;
    const want = [];
    if (ids.hostId) want.push(['data-host-id', ids.hostId]);
    if (ids.service) want.push(['data-service', ids.service]);
    if (ids.networkId) want.push(['data-network-id', ids.networkId]);
    if (ids.resourceId) want.push(['data-resource-id', ids.resourceId]);
    if (action === 'confirm') want.push(['data-finding', alias(ids.findingId)]);
    return all.find(b => want.every(([a, v]) => attrOf(b.closest(`[${a}]`), a) === v)) || null;
}

/** Press an offer in the mounted skin. A use is the skin's own two-step. */
function press(h, offer, w) {
    const view = h.view();
    if (offer.action === 'use') {
        const alias = [...w.rows].flatMap(r => r.findings || []).concat([w.answers.check.findings[0]]).find(f => f.id === offer.ids.findingId)?.alias;
        if (view.mounted === 'gui') {
            view.selectFinding(alias);
            view.selectTechnique(offer.ids.techniqueId);
            view.useSelected();
        } else {
            const root = view.container;
            root.querySelector(`[data-technique="${offer.ids.techniqueId}"] [data-action="select-technique"]`).click();
            root.querySelector(`[data-technique="${offer.ids.techniqueId}"][data-finding="${alias}"] [data-action="use"]`).click();
        }
        return true;
    }
    const b = controlFor(h, offer, w);
    if (!b) return false;
    b.click();
    return true;
}

const submit = async (h, line) => {
    const input = term(h).querySelector('.network-term-input');
    input.value = line;
    input.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await settle();
};

/** Wraps the scene's showResult so a snapshot is taken the instant it returns (after any notice it set). */
function watchResult(h) {
    const view = h.view();
    const real = view.showResult.bind(view);
    h.afterResult = null;
    view.showResult = (offer, answer) => {
        real(offer, answer);
        h.afterResult = h.view().mounted === 'cli'
            ? { strip: termStrip(h), lines: termLines(h), toasts: h.toasts.length }
            : { pieces: panelsPieces(h), toasts: h.toasts.length };
    };
}

/** A skin's snapshot of what is on screen now. */
const snap = (h) => (h.view().mounted === 'cli'
    ? { strip: termStrip(h), lines: termLines(h), toasts: h.toasts.length }
    : { pieces: panelsPieces(h), toasts: h.toasts.length });

// ---------------------------------------------------------------------------------------------
// Comparing
// ---------------------------------------------------------------------------------------------

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const FRAGMENTS = [...FMT.TERMINAL_ONLY_TEXT].map(s => String(s)).filter(s => s.trim() !== '');
const TEMPLATE_RES = FRAGMENTS.map(s => new RegExp(`^${escapeRe(s.trim()).replace(/<[^>]*>/g, '.*')}$`));

// Text of a Panels control that explains a Panels gesture the Terminal does not have
const PANELS_GESTURE_TEXT = Object.freeze(['Pick a finding, then a card.', /^Finding \S+ with /]);


// The only places where the two skins lay one fact out differently. Anything else must match a Panels piece whole.
// A Terminal span may be checked word by word (against the words Panels show, the ids, the commands and the
// defaults) only when it has one of these shapes; a number must be one Panels show, a served port, or a count of rows.
const CHIP_WORDS = [...Object.values(model.CLASS_WORDS), ...Object.values(model.SEVERITY_WORDS)];
const CHIP_RE = `(?:${CHIP_WORDS.map(escapeRe).join('|')})`;
export const TERMINAL_LAYOUTS = Object.freeze([
    /^\[[-+*!]\]$/,                                         // a tool's line mark
    /^[\w .-]+:$/,                                           // a label with a colon
    /^[\w-]+ \(.+\)$/,                                       // a service name and its label
    /^\d+\/(tcp|udp) open \S+(?: .+)?$/,                     // the scanner's port row
    /^\d+$/,                                                // a port cell
    new RegExp(`^${CHIP_RE} ${CHIP_RE}(?: on .+)?$`),        // class and severity, then the service
    /^Nmap done: \d+ hosts? up$/,                            // the scanner's closing line
    /^\S+:\d+ - The target (?:appears to be vulnerable|is not vulnerable)\.$/,
    /^Session opened on \S+ as .+$/
]);

/** A Panels piece the Terminal lays out another way: the chips, the service line, the grant sentence. */
function samePieceByLayout(p, terminal, termWords) {
    if (!/[\p{L}\p{N}]/u.test(p)) return true;                  // a mark with no letter (the cross)
    if (CHIP_WORDS.includes(p)) return wordsOf(p).every(w => termWords.has(w));
    const all = [...terminal.elements, ...terminal.lines.map(l => l.join(' ')), ...terminal.lines.flat()].map(collapse);
    const port = /^(.+) · (\d+) · (.+)$/.exec(p);                // label, port, product and version
    if (port) return all.some(t => t.includes(`${port[2]}/`) && t.endsWith(port[3]) && /\bopen\b/.test(t)) && all.some(t => t.includes(port[1]));
    const grant = /^You now hold a session on .+ as (.+?)\.(?: (\w+))?$/.exec(p);
    if (grant) return all.some(t => new RegExp(`^(?:\\[\\*\\] )?Session opened on \\S+ as ${escapeRe(grant[1])}$`).test(t)) && (!grant[2] || all.some(t => t.split(' ').includes(grant[2])));
    return false;
}

/** The key two pieces are compared by: no white space and no joining punctuation (the skins punctuate differently). */
const key = (s) => collapse(s).replace(/[\s\u00B7,:;()]/g, '');

const WORD = /[^\p{L}\p{N}_-]+/u;
const wordsOf = (s) => collapse(s).split(WORD).filter(Boolean);
const FRAGMENT_WORDS = new Set(FRAGMENTS.flatMap(wordsOf));

/**
 * Compares what Panels newly show (`panels`) with what the Terminal shows (`terminal`: element pieces and lines of
 * spans). `panelsAll` is everything Panels show after the step, which a Terminal span may also repeat.
 * Strict first: a Panels piece must be a Terminal piece, or the joined text of neighbouring spans of one line, and
 * a Terminal span a Panels piece (or part of a run that is). Where the two skins lay one fact out differently (the
 * scanner's port line, a tool's result layout), the words are compared instead: every word of a Panels piece must
 * be on the Terminal side, and every word of a Terminal span must be a word Panels show, a row id, a command word,
 * a control title word, a fixed Terminal template word, a default of cli-gen/defaults.js, or a number.
 * Returns the problems, each a string.
 */
function compare(label, panelsRaw, terminal, { ids, commands, titles, defaults, modules = new Set(), ports = [], hostCount = 0 }, panelsAllRaw = panelsRaw, counted = false) {
    const problems = [];
    // "<kind> on <host>": the Terminal has the kind and the host as two columns, and the host is a piece of its own in Panels
    const fold = (list) => list.map(p => {
        for (const q of list) if (q !== p && p.endsWith(` on ${q}`)) return p.slice(0, p.length - q.length - 4);
        return p;
    });
    const panels = fold(panelsRaw);
    const panelsAll = fold(panelsAllRaw);
    const panelsKeys = new Set(panels.map(key));
    const runKeys = new Set();
    const covered = [];
    const termWords = new Set([...terminal.elements.flatMap(wordsOf), ...terminal.lines.flatMap(l => l.flatMap(wordsOf))]);
    for (const line of terminal.lines) {
        const cover = line.map(() => false);
        for (let i = 0; i < line.length; i++) {
            let joined = '';
            for (let j = i; j < line.length; j++) {
                joined = `${joined} ${line[j]}`;
                const k = key(joined);
                runKeys.add(k);
                if (panelsKeys.has(k)) for (let m = i; m <= j; m++) cover[m] = true;
            }
        }
        covered.push(cover);
    }
    const elementKeys = new Set(terminal.elements.map(key));
    for (const p of panels) {
        if (PANELS_ONLY_TEXT.includes(p) || PANELS_GESTURE_TEXT.some(g => (g instanceof RegExp ? g.test(p) : g === p))) continue;
        if (elementKeys.has(key(p)) || runKeys.has(key(p))) continue;
        const missing = wordsOf(p).filter(w => !termWords.has(w));
        if (samePieceByLayout(p, terminal, termWords)) continue;
        problems.push(`${label}: Panels piece not in the Terminal: ${JSON.stringify(p)} (words missing: ${missing.join(' ')})`);
    }
    const allowedWords = new Set([...panelsAll.flatMap(wordsOf), ...[...ids].flatMap(wordsOf), ...[...commands].flatMap(wordsOf),
        ...[...titles].flatMap(wordsOf), ...FRAGMENT_WORDS, ...defaults]);
    const allowedNumbers = new Set([...panelsAll.flatMap(wordsOf), ...ports, ...Array.from({ length: hostCount + 1 }, (_, i) => String(i))]);
    const allowedWord = (w) => (/^\d+$/.test(w) ? allowedNumbers.has(w) || allowedWords.has(w) : allowedWords.has(w));
    const idKeys = new Set([...ids].map(key));
    const allKeys = new Set(panelsAll.map(key));
    const allowed = (p) => {
        const k = key(p);
        if (idKeys.has(k) || modules.has(p) || commands.has(p) || titles.has(p) || TEMPLATE_RES.some(re => re.test(p)) || panelsKeys.has(k) || allKeys.has(k)) return true;
        return TERMINAL_LAYOUTS.some(re => re.test(p)) && wordsOf(p).every(allowedWord);
    };
    const wrong = (p) => wordsOf(p).filter(w => !allowedWord(w));
    for (const p of terminal.elements) if (!allowed(collapse(p))) problems.push(`${label}: Terminal element piece not in Panels: ${JSON.stringify(p)} (words: ${wrong(collapse(p)).join(' ')})`);
    terminal.lines.forEach((line, li) => line.forEach((text, i) => {
        const p = collapse(text);
        if (p === '' || covered[li][i]) return;
        if (!allowed(p)) problems.push(`${label}: Terminal span not in Panels: ${JSON.stringify(p)} (words: ${wrong(p).join(' ')}) (line ${JSON.stringify(line.join('|'))})`);
    }));
    if (counted) {
        // A sentence is shown as many times as Panels show it: a status on every row, or on one row twice, is a difference
        const tally = (list) => { const m = new Map(); for (const p of list) { const k = key(p); if (/\s/.test(collapse(p))) m.set(k, [(m.get(k) || [0, p])[0] + 1, p]); } return m; };
        const pc = tally(panels);
        // a line that is one Panels piece spread over spans counts once; any other line counts span by span
        const pieces = [...terminal.elements, ...terminal.lines.flatMap(l => (panelsKeys.has(key(l.join(' '))) ? [l.join(' ')] : l))];
        const tc = tally(pieces.map(collapse).filter(Boolean));
        for (const [k, [n, p]] of tc) if (pc.has(k) && pc.get(k)[0] !== n) problems.push(`${label}: ${JSON.stringify(p)} is shown ${pc.get(k)[0]} time(s) by Panels and ${n} by the Terminal`);
    }
    return problems;
}

function context(h) {
    const view = h.view();
    const offers = view.currentOffers();
    const ids = new Set([...view.allRows().map(r => r.id), ...(view.networkBlocks?.() || []).map(b => b.id)]);
    for (const r of view.allRows()) for (const f of r.findings || []) { ids.add(f.id); ids.add(f.alias); }
    for (const s of Object.keys(view.view?.techniques || {})) ids.add(s);
    // What the Terminal builds for a service or a finding the server sent no `cli` fields for (unit 06's defaults)
    const defaults = new Set();
    const modules = new Set();
    for (const r of view.allRows()) {
        for (const sv of r.services || []) for (const v of Object.values(DEFAULTS.serviceCli(sv))) wordsOf(String(v)).forEach(x => defaults.add(x));
        for (const f of r.findings || []) {
            const sv = (r.services || []).find(x => x.name === f.service);
            for (const v of Object.values(DEFAULTS.findingCli(f, sv))) if (typeof v === 'string') wordsOf(v).forEach(x => defaults.add(x));
            modules.add(String(DEFAULTS.findingCli(f, sv).module ?? ''));
            if (f.cli?.module) modules.add(String(f.cli.module));
        }
    }
    const ports = new Set();
    for (const r of view.allRows()) for (const sv of r.services || []) if (sv.port !== undefined) ports.add(String(sv.port));
    return { ids, ports, hostCount: view.allRows().length, commands: new Set(offers.map(o => o.command).filter(Boolean)), titles: new Set(Object.values(CONTROLS).map(c => c.title)), defaults, modules };
}

// ---------------------------------------------------------------------------------------------
// One step in both skins
// ---------------------------------------------------------------------------------------------

/** The links stub that answers an unplug with `message`, held until `release`. */
function stubUnplug(h, message) {
    const state = { resolve: null };
    window.networkLinks.unplugFromView = () => new Promise(r => { state.resolve = (v) => r(v); });
    return state;
}

/**
 * Opens one skin, makes a move, settles it, and reads everything the comparison needs before the skin is closed
 * (the harness holds one open view at a time). `step`: `pick(offers)` chooses the offer (none: the opening render);
 * `answer`: what the request resolves with (an Error rejects: no reply); `patch(body, offer)`: the server's view
 * after the move, for the refetch; `setup(h)`: anything to do first.
 */
async function runSkin(skin, w, step) {
    const body = clone(w.body);
    const h = await mount(body, { unplug: true, hold: true, params: { skin, message: w.message } });
    const out = { skin, toasts: [] };
    try {
        watchResult(h);
        if (step.setup) await step.setup(h);
        let offer = null;
        if (step.pick) {
            offer = step.pick(h.view().currentOffers());
            if (!offer) { out.noOffer = true; return out; }
            out.offer = offer;
            const unplugState = offer.action === 'unplug' ? stubUnplug(h, w.unplugMessage) : null;
            out.before = snap(h);
            assert.ok(press(h, offer, w), `no control for ${offer.action} ${JSON.stringify(offer.ids)} in ${skin}`);
            await settle();
            // The echo and `started` lines are written at press time, so what follows is the result
            out.mid = snap(h);
            out.guarded = ['sweep', 'scan', 'check', 'confirm', 'use', 'unplug'].includes(offer.action);
            if (out.guarded) {
                if (step.patch) step.patch(body, offer);
                if (unplugState) unplugState.resolve(step.answer instanceof Error ? null : step.answer);
                else await h.release(step.answer);
            }
            await settle();
            out.afterResult = h.afterResult || snap(h);
            out.toasts = h.toasts.map(([m]) => collapse(m));
        }
        out.ctx = context(h);
        if (skin === 'gui') {
            out.state = panelsPieces(h);
        } else {
            const echoAt = termLines(h).length;
            await submit(h, 'show');
            const stateLines = termLines(h).slice(echoAt + 1);
            // R2-11: the framework's own facts (accounts, statuses, targets) are read against Panels too
            for (const line of ['msfconsole', 'sessions', 'search', 'info', 'show options']) {
                const at = termLines(h).length;
                await submit(h, line);
                stateLines.push(...termLines(h).slice(at + 1));
            }
            out.state = { elements: termStrip(h), lines: stateLines };
        }
    } finally {
        h.end();
    }
    return out;
}

/**
 * The Terminal's lines new since the press, less the echo and `started` lines: those were written at press time
 * (already there at `mid`) for a guarded move; for a row's own move the echo is the one line after `before`.
 */
const resultLines = (o) => o.afterResult.lines.slice(o.guarded ? o.mid.lines.length : o.before.lines.length + 1);

/** What a step shows in each skin: compare the result, then (after the refetch) the state. */
async function checkStep(label, w, step) {
    const gui = await runSkin('gui', w, step);
    const cli = await runSkin('cli', w, step);
    const problems = [];
    assert.equal(!!gui.noOffer, !!cli.noOffer, `${label}: the offer exists in one skin only`);
    if (gui.noOffer) return problems;
    if (gui.offer) {
        assert.deepEqual(gui.offer.ids, cli.offer.ids);
        const panelsNew = [...added(gui.before.pieces, gui.afterResult.pieces), ...gui.toasts];
        const termNew = { elements: added(cli.before.strip, cli.afterResult.strip), lines: resultLines(cli) };
        if (!step.heldOnly) problems.push(...compare(`${label} [result]`, panelsNew, termNew, cli.ctx, [...gui.afterResult.pieces, ...gui.toasts]));
        if (gui.guarded && step.held) {
            // While the request is out: the pending label (and Panels' Scanning bar), nothing else
            const heldNew = added(gui.before.pieces, gui.mid.pieces);
            problems.push(...compare(`${label} [held]`, heldNew, { elements: added(cli.before.strip, cli.mid.strip), lines: [] }, cli.ctx, gui.mid.pieces));
        }
        if (process.env.DBG) console.error(label, 'RESULT', JSON.stringify({ panelsNew, termNew }));
    }
    if (!step.heldOnly) problems.push(...compare(`${label} [state]`, gui.state, cli.state, cli.ctx, gui.state, true));
    return problems;
}

const OPS = ['sweep', 'scan', 'check', 'confirm', 'use'];
const rowById = (w, id) => w.rows.find(r => r.id === id);
const findingById = (w, id) => w.rows.flatMap(r => r.findings || []).find(f => f.id === id);
/** The success answer the server would send for an offer (a scan names the scanned row, a check its service). */
const answerFor = (w, offer, extra = {}) => {
    const { action, ids } = offer;
    let a;
    if (action === 'use') a = ids.techniqueId === 't1' ? w.answers.useSession : w.answers.useCredential;
    else if (action === 'scan') a = { success: true, host: { ...rowById(w, ids.hostId), scanned: true, services: w.answers.scan.host.services } };
    else if (action === 'check') a = { success: true, hostId: ids.hostId, service: ids.service, findings: [{ ...w.answers.check.findings[0], service: ids.service, id: `${ids.hostId}.${ids.service}.found`, alias: ids.service === 'web' ? 'f5' : 'f6' }] };
    else if (action === 'confirm') a = { success: true, finding: { ...findingById(w, ids.findingId), status: 'confirmed', needs: w.answers.confirm.finding.needs } };
    else a = w.answers[action];
    return a ? { ...clone(a), ...extra } : undefined;
};
/** The server's view after a success answer, for the refetch that follows. */
const patchFor = (w, answer) => (body, offer) => {
    if (!answer || answer.success === false || offer.action === 'use') return;
    body.footholds[0] = model.applyOpsAnswer(body.footholds[0], offer, answer);
};
const labelOf = (o) => `${o.action} ${JSON.stringify(o.ids)}`;
const stepFor = (w, offer, answer) => ({ pick: (list) => list.find(o => o.action === offer.action && JSON.stringify(o.ids) === JSON.stringify(offer.ids)), answer, patch: patchFor(w, answer) });
const baseOffers = async (w) => {
    const h = await mount(clone(w.body), { unplug: true, params: { skin: 'gui' } });
    const list = clone(h.view().currentOffers());
    h.end();
    return list;
};

const failing = (list) => assert.deepEqual(list, [], `\n${list.join('\n')}`);

test.beforeEach(() => { choice.forgetPress(); delete window.gameScenario; });

test('the opening render says the same in both skins', async () => {
    const w = world();
    failing(await checkStep('opening', w, {}));
});

test('every offer, in offers() order, with the same fake answer, then the refetch', async () => {
    const w = world();
    const list = await baseOffers(w);
    assert.ok(list.length >= 20, `a fixture with an offer of every kind (${list.length})`);
    for (const action of ['sweep', 'scan', 'check', 'confirm', 'use', 'sign-in', 'open', 'observe', 'unplug']) {
        assert.ok(list.some(o => o.action === action), `the fixture offers ${action}`);
    }
    const problems = [];
    // Unplug is left to its own test: a success closes the view, so there is nothing to compare afterwards
    for (const offer of list.filter(o => o.action !== 'unplug')) {
        problems.push(...await checkStep(labelOf(offer), w, stepFor(w, offer, answerFor(w, offer))));
    }
    failing(problems);
});

test('while a request is out, each skin shows the pending label', async () => {
    const w = world();
    const list = await baseOffers(w);
    const problems = [];
    for (const action of ['sweep', 'scan', 'check', 'confirm', 'use', 'unplug']) {
        const offer = list.find(o => o.action === action);
        const step = stepFor(w, offer, action === 'unplug' ? { action: 'error', message: w.unplugMessage } : answerFor(w, offer));
        problems.push(...await checkStep(`held ${action}`, w, { ...step, held: true, heldOnly: true }));
    }
    failing(problems);
});

test('one `already` answer per ops route', async () => {
    const w = world();
    const list = await baseOffers(w);
    const problems = [];
    for (const action of OPS) {
        const offer = list.find(o => o.action === action);
        problems.push(...await checkStep(`already ${labelOf(offer)}`, w, stepFor(w, offer, answerFor(w, offer, { already: true }))));
    }
    failing(problems);
});

test('one refusal per code, on a scan and on a use', async () => {
    const w = world();
    const list = await baseOffers(w);
    const problems = [];
    for (const code of CODES) {
        const answer = { success: false, reason: code, ...(code === 'need_unmet' ? { need: { label: w.needLabel } } : {}) };
        // `need_unmet` names the missing need only on a use (the scene's other refusals use the code's plain words)
        for (const action of code === 'need_unmet' ? ['use'] : ['scan', 'use']) {
            const offer = list.find(o => o.action === action);
            problems.push(...await checkStep(`refusal ${code} on ${action}`, w, stepFor(w, offer, answer)));
        }
    }
    failing(problems);
});

test('a request with no reply, for each of sweep, scan, check, confirm and use', async () => {
    const w = world();
    const list = await baseOffers(w);
    const problems = [];
    for (const action of OPS) {
        const offer = list.find(o => o.action === action);
        problems.push(...await checkStep(`no reply ${action}`, w, stepFor(w, offer, new Error('no reply'))));
    }
    failing(problems);
});

test('an unplug held and then refused, and an unplug with no reply', async () => {
    const w = world();
    const list = await baseOffers(w);
    const offer = list.find(o => o.action === 'unplug');
    const problems = [];
    problems.push(...await checkStep('unplug refused', w, stepFor(w, offer, { action: 'error', message: w.unplugMessage })));
    problems.push(...await checkStep('unplug no reply', w, stepFor(w, offer, new Error('no reply'))));
    failing(problems);
});

test('the comparison itself finds a missing piece, an extra piece and a changed word', () => {
    const ctx = { ids: new Set(['row_a']), commands: new Set(), titles: new Set(), defaults: new Set(), ports: new Set(['445']), hostCount: 2 };
    const terminal = (...lines) => ({ elements: [], lines });
    assert.deepEqual(compare('same', ['Mk1name', 'Mk2host'], terminal(['Mk1name', '   ', 'Mk2host']), ctx), []);
    assert.equal(compare('missing', ['Mk1name', 'Mk2host'], terminal(['Mk1name']), ctx).length, 1);
    assert.equal(compare('extra', ['Mk1name'], terminal(['Mk1name', 'Mk9extra']), ctx).length, 1);
    assert.equal(compare('changed', ['Remote sign-in off'], terminal(['Remote sign-in lit']), ctx).length, 2);
    assert.deepEqual(compare('ids and numbers', ['Mk1name'], terminal(['Mk1name', 'row_a', '445']), ctx), []);
    assert.deepEqual(compare('template', [], terminal(['Nmap scan report for ', 'row_a']), ctx), []);
});

test('the comparison catches the three probes that once passed: a status on every row, invented numbers, a reordered sentence', async () => {
    const VT = await imp(`${NV}view-texts.js`);
    const ctx = { ids: new Set(['row_a', 'row_b', 'row_c']), commands: new Set(), titles: new Set(), defaults: new Set(['tcp', 'open', 'smb']), ports: new Set(['80', '445']), hostCount: 3 };
    const terminal = (...lines) => ({ elements: [], lines });
    const off = 'Remote sign-in off';
    // 1. a status Panels show on one row, shown on every row
    assert.deepEqual(compare('one row', ['Mk1a', off, 'Mk2b', 'Mk3c'], terminal(['Mk1a', off], ['Mk2b'], ['Mk3c']), ctx, undefined, true), []);
    assert.ok(compare('every row', ['Mk1a', off, 'Mk2b', 'Mk3c'], terminal(['Mk1a', off], ['Mk2b', off], ['Mk3c', off]), ctx, undefined, true).length > 0);
    // 2. numbers nothing served: an invented line in a scan result
    assert.deepEqual(compare('port', [], terminal(['445/tcp open smb']), ctx), []);
    assert.ok(compare('invented', [], terminal(['10.20.30.40', ' 8443', ' 2024']), ctx).length > 0);
    assert.ok(compare('invented port row', [], terminal(['8443/tcp open smb']), ctx).length > 0);
    // 3. a fixed sentence with its halves swapped
    const [first, second] = VT.CREDENTIAL_GRANT_TEXT.split(/(?<=\.) /);
    assert.deepEqual(compare('whole', [VT.CREDENTIAL_GRANT_TEXT], terminal([VT.CREDENTIAL_GRANT_TEXT]), ctx), []);
    assert.ok(compare('swapped', [VT.CREDENTIAL_GRANT_TEXT], terminal([`${second} ${first}`]), ctx, [VT.CREDENTIAL_GRANT_TEXT]).length > 0);
    assert.ok(compare('swapped, state', [VT.CREDENTIAL_GRANT_TEXT], terminal([`${second} ${first}`]), ctx, undefined, true).length > 0);
});
