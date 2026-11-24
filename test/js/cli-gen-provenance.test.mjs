// Where every printed span comes from (Ops S6 unit 13): over every fixture and every generator call,
// a span is a template with its slots filled, a field of the answer, the view or a served `cli`
// object, a default of cli-gen/defaults.js, or a count computed from them. Nothing else is printed.
// Run with: node test/js/cli-gen-provenance.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const NV = join(here, '../../public/break_escape/js/minigames/network-view');
const load = (f) => import(pathToFileURL(join(NV, f)));
const REG = await load('cli-gen/registry.js');
const SC = await load('cli-gen/scanner-output.js');
const FW = await load('cli-gen/framework-console.js');
const DEF = await load('cli-gen/defaults.js');
const OM = await load('ops-model.js');
const VT = await load('view-texts.js');
const FMT = await load('terminal-format.js');
const GR = await load('terminal-grammar.js');

const FIX = join(here, 'fixtures/network-view');
const fx = (name) => JSON.parse(readFileSync(join(FIX, `${name}.json`), 'utf8'));
const viewOf = (name) => { const d = fx(name); return { ...d.footholds[0], techniques: d.techniques || fx('techniques').techniques }; };
const clone = (v) => JSON.parse(JSON.stringify(v));
const CLASSES = ['prompt', 'head', 'ok', 'bad', 'note'];
const CODES = JSON.parse(readFileSync(join(here, '../fixtures/files/ops_refusal_codes.json'), 'utf8'));
const names = readdirSync(FIX).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort()
    .filter(name => { const v = fx(name).footholds?.[0]; return v && Array.isArray(v.hosts); });

const allRows = (v) => [...(v.hosts || []), ...(v.networks || []).flatMap(b => b.hosts || [])];

/** Every call a Terminal makes into a generator for a view: [kind, label, lines]. */
function calls(view) {
    const out = [];
    const add = (kind, label, lines) => out.push({ kind, label, lines });
    const rows = allRows(view);
    const nets = (view.networks || []).filter(b => b.id);
    for (const b of nets) {
        const o = { action: 'sweep', target: b.id, ids: { networkId: b.id } };
        add('sweep', b.id, SC.started(o, view));
        add('sweep', b.id, SC.result(o, { success: true, network: { id: b.id, swept: true, hosts: clone(b.hosts || []) } }, view));
        add('sweep', b.id, SC.result(o, { success: false, reason: 'not_found' }, view));
        add('sweep', b.id, SC.result(o, null, view));
    }
    for (const r of rows) {
        if (r.scanned === true && Array.isArray(r.services)) {
            const o = { action: 'scan', target: r.id, ids: { hostId: r.id } };
            add('scan', r.id, SC.started(o, view));
            add('scan', r.id, SC.result(o, { success: true, host: clone(r) }, view));
            for (const s of r.services) {
                const c = { action: 'check', target: `${r.id}:${s.name}`, ids: { hostId: r.id, service: s.name } };
                add('check', `${r.id}:${s.name}`, SC.started(c, view));
                add('check', `${r.id}:${s.name}`, SC.result(c, { success: true, hostId: r.id, service: s.name, findings: clone((r.findings || []).filter(f => f.service === s.name)) }, view));
            }
        }
    }
    const mods = FW.moduleList(view);
    add('listing', 'banner', FW.banner());
    add('listing', 'search', FW.search(view));
    add('listing', 'sessions', FW.sessions(view));
    add('listing', 'prompt', [[{ text: FW.promptMark({ prompt: 'msf', module: null }, view) }]]);
    for (const m of mods) {
        const mode = { prompt: 'msf', module: m.finding.id, technique: null };
        add('listing', `info ${m.finding.alias}`, FW.info(view, mode));
        add('listing', `options ${m.finding.alias}`, FW.showOptions(view, mode));
        add('listing', 'prompt', [[{ text: FW.promptMark(mode, view) }]]);
        const c = { action: 'confirm', target: m.finding.id, ids: { findingId: m.finding.id } };
        add('confirm', m.finding.alias, FW.started(c, view));
        add('confirm', m.finding.alias, FW.result(c, { success: true, finding: clone(m.finding) }, view));
        add('confirm', m.finding.alias, FW.result(c, { success: false, reason: 'not_responding' }, view));
        add('confirm', m.finding.alias, FW.result(c, null, view));
        for (const t of Object.keys(view.techniques || {})) {
            const u = { action: 'use', target: { card: t, finding: m.finding.id }, ids: { findingId: m.finding.id, techniqueId: t, itemId: `card_${t}` } };
            add('use', m.finding.alias, FW.started(u, view));
            add('use', m.finding.alias, FW.result(u, { success: true, grant: 'session', session: { displayName: 'Sam', access: 'admin' } }, view));
            add('use', m.finding.alias, FW.result(u, { success: true, grant: 'credential' }, view));
            add('use', m.finding.alias, FW.result(u, { success: false, reason: 'need_unmet', need: { label: 'Admin login' } }, view));
            add('use', m.finding.alias, FW.result(u, { success: false, reason: 'a_code_nobody_sent' }, view));
        }
    }
    for (const code of CODES) add('refusal', code, SC.result({ action: 'scan', ids: {} }, { success: false, reason: code }, view));
    return out;
}

// ---------------------------------------------------------------------------------------------
// The sources a span may come from
// ---------------------------------------------------------------------------------------------

function leaves(value, into) {
    if (typeof value === 'string') into.add(value);
    else if (typeof value === 'number') into.add(String(value));
    else if (Array.isArray(value)) value.forEach(v => leaves(v, into));
    else if (value && typeof value === 'object') Object.values(value).forEach(v => leaves(v, into));
    return into;
}
// A template's pieces, and its words (a table pads the columns of a template head line)
const templateAtoms = (list) => list.flatMap(t => String(t).split(/<[^>]*>/)).flatMap(p => [p, ...p.split(/\s+/)]);

function atomsFor(view) {
    const set = new Set();
    leaves(view, set);
    const extra = ['Sam', 'admin', 'Admin login', 'a_code_nobody_sent', ...Object.keys(view.techniques || {})];
    extra.forEach(e => set.add(e));
    templateAtoms([...SC.TEMPLATES, ...FW.TEMPLATES, ...FMT.TERMINAL_ONLY_TEXT]).forEach(t => set.add(t));
    for (const mod of Object.values(VT)) if (typeof mod === 'string') set.add(mod);
    for (const table of [OM.STATUS_WORDS, OM.CLASS_WORDS, OM.SEVERITY_WORDS, OM.REFUSAL_TEXT]) Object.values(table).forEach(t => set.add(t));
    [OM.UNKNOWN_REFUSAL_TEXT, OM.FIXED_TEXT, OM.ACCESS_TAG_TEXT, ' Missing: ', 'yes', 'no'].forEach(t => set.add(t));
    // The defaults of unit 06, built from the view
    for (const r of allRows(view)) {
        set.add(DEF.hostTarget(r));
        for (const s of Array.isArray(r.services) ? r.services : []) {
            const c = DEF.serviceCli(s);
            set.add(c.protocol); set.add(c.service);
            for (const f of (r.findings || []).filter(x => x.service === s.name)) {
                const fc = DEF.findingCli(f, OM.rowServices(r).find(x => x.name === s.name) || s);
                set.add(fc.title); set.add(fc.module); set.add(fc.script);
                set.add(OM.findingLabel(f));
                for (const need of OM.findingNeeds(f)) set.add(OM.needLine(need));
            }
        }
    }
    // Sentences composed from fields by the model's own functions
    set.add(VT.sessionGrantText('', '')); set.add(OM.useResultText({ grant: 'session', session: { displayName: 'Sam' } }, view, null));
    for (const r of allRows(view)) set.add(OM.useResultText({ grant: 'session', session: { displayName: 'Sam' } }, view, r.id));
    return [...set].filter(a => a !== '');
}

function explained(text, atoms) {
    if (/^\s*$/.test(text)) return true;
    let rest = text;
    for (const a of atoms) {
        if (a.length < 3) continue;
        rest = rest.split(a).join('\u0001');
    }
    if (atoms.includes(text.trim())) return true;
    // what is left is a separator, a count or a digit; any word left over is unexplained
    return !/[A-Za-z]/.test(rest.replace(/\u0001/g, ''));
}

test('the registry maps exactly the five actions', () => {
    assert.deepEqual(Object.keys(REG.GENERATORS).sort(), ['check', 'confirm', 'scan', 'sweep', 'use']);
    for (const g of Object.values(REG.GENERATORS)) {
        assert.equal(typeof g.id, 'string');
        assert.equal(typeof g.started, 'function');
        assert.equal(typeof g.result, 'function');
        assert.ok(Array.isArray(g.TEMPLATES) && Object.isFrozen(g.TEMPLATES));
    }
});

test('every span of every generator call is explained', () => {
    let spans = 0;
    for (const name of names) {
        const view = viewOf(name);
        const atoms = atomsFor(view).sort((a, b) => b.length - a.length);
        for (const call of calls(view)) {
            for (const line of call.lines) {
                assert.ok(Array.isArray(line), `${name} ${call.kind} ${call.label}: a line is a list of spans`);
                for (const s of line) {
                    spans += 1;
                    assert.equal(typeof s.text, 'string');
                    assert.ok(s.cls === undefined || CLASSES.includes(s.cls), `${name} ${call.kind}: class ${s.cls}`);
                    assert.ok(explained(s.text, atoms), `${name} ${call.kind} ${call.label}: unexplained span "${s.text}"`);
                }
            }
        }
    }
    assert.ok(spans > 500, `a real number of spans were checked (${spans})`);
});

test('every span of the plain layouts is explained', () => {
    for (const name of names) {
        const view = viewOf(name);
        const atoms = [...atomsFor(view), ...FMT.TERMINAL_ONLY_TEXT, 'Nothing answers on this network.', 'Nothing more to see from here.',
            'Computers', 'Devices', 'File shares', 'Printers and devices', 'Phones', 'Other devices', 'File share', 'Printer', 'Computer', 'Phone', 'Device', ', through ', '(Locked)',
            'HOST', 'NAME', 'STATUS', 'RESOURCE', 'KIND', 'SERVICE', 'PORT', 'PRODUCT', 'VERSION', 'TECHNIQUE', 'WORKS ON']
            .flatMap(t => templateAtoms([t])).sort((a, b) => b.length - a.length);
        const lists = [FMT.formatListing(view, { status: 'Joined. Reaches 1 host.' }), FMT.formatListing(view, { notice: 'n' })];
        for (const lines of lists) {
            for (const line of lines) for (const s of line) {
                assert.ok(s.cls === undefined || CLASSES.includes(s.cls));
                assert.ok(explained(s.text, [...atoms, 'Joined. Reaches 1 host.', 'n'.repeat(1)]), `${name}: unexplained span "${s.text}"`);
            }
        }
    }
});

// ---------------------------------------------------------------------------------------------
// Markers: a field shows only where it is printed
// ---------------------------------------------------------------------------------------------

function marked() {
    const v = clone(viewOf('findings_states'));
    const M = {};
    const mark = (obj, key, tag) => { M[tag] = `MARK_${tag.toUpperCase()}_${Object.keys(M).length}`; obj[key] = M[tag]; };
    const targets = [];
    for (const r of allRows(v)) targets.push(r);
    for (const r of targets) {
        if (r.id !== 'print01' && !r.id.startsWith('print01')) { /* every row's own fields are marked below */ }
        mark(r, 'observations', `obs_${r.id}`);
        r.leak = `LEAK_ROW_${r.id}`;
        for (const s of r.services || []) { s.leak = `LEAK_SVC_${r.id}_${s.name}`; }
        for (const f of r.findings || []) f.leak = `LEAK_FINDING_${f.alias}`;
    }
    const host = v.hosts.find(r => r.id === 'print01') || v.hosts[0];
    const svc = host.services[0];
    svc.cli = { banner: 'MARK_BANNER', service: 'MARK_CLISERVICE', protocol: 'tcp' };
    const f = host.findings.find(x => x.service === svc.name);
    f.cli = { title: 'MARK_TITLE', module: 'training/mark/module_path', script: 'mark-script', advisories: ['TRN-0000-9999'], output: ['MARK_OUTPUT'] };
    v.networks[0].cli = { range: '10.9.8.0/24' };
    // the own block repeats the top-level rows: give it the marked copy, since the module list reads the block first
    for (const n of v.networks) if (n.id === v.network?.id) n.hosts = clone(v.hosts);
    return { v, host, svc, f };
}

test('a field shows only where it is printed', () => {
    const { v, host, svc, f } = marked();
    const all = calls(v);
    const text = (c) => c.lines.map(l => l.map(s => s.text).join('')).join('\n');
    const seen = (needle) => all.filter(c => text(c).includes(needle));
    const kinds = (needle) => [...new Set(seen(needle).map(c => c.kind))].sort();
    // never printed anywhere: a leak field or an observation (Look prints those, not a generator)
    for (const c of all) assert.ok(!/LEAK_|MARK_OBS_/.test(text(c)), `${c.kind} ${c.label}: ${text(c)}`);
    assert.deepEqual(kinds('MARK_BANNER'), ['scan']);
    assert.deepEqual(kinds('MARK_OUTPUT'), ['check']);
    assert.deepEqual(kinds('mark-script'), ['check']);
    assert.deepEqual(kinds('MARK_CLISERVICE'), ['check', 'listing', 'scan']);
    assert.deepEqual(kinds('10.9.8.0/24'), ['sweep']);
    assert.deepEqual(kinds('TRN-0000-9999'), ['check', 'listing']);
    assert.deepEqual(kinds('training/mark/module_path'), ['listing']);
    assert.ok(seen('MARK_TITLE').every(c => ['check', 'listing'].includes(c.kind)));
    assert.deepEqual([...new Set(seen('MARK_BANNER').map(c => c.label))], [host.id]);
    assert.deepEqual([...new Set(seen('MARK_OUTPUT').map(c => c.label))], [`${host.id}:${svc.name}`]);
    assert.ok(f.cli.title);
});

test('a refusal prints only its words, not its other fields', () => {
    const view = viewOf('findings_states');
    const o = { action: 'scan', target: 'print01', ids: { hostId: 'print01' } };
    const body = { success: false, reason: 'not_responding', leak: 'LEAK_BODY', message: 'LEAK_MESSAGE', need: { label: 'LEAK_NEED' } };
    for (const gen of [SC, FW]) {
        const text = gen.result(o, body, view).map(l => l.map(s => s.text).join('')).join('\n');
        assert.ok(text.includes(OM.refusalText('not_responding')));
        assert.ok(!/LEAK_/.test(text));
    }
    const log = FMT.logFor('prov_trip', { create: true });
    FMT.recordResult(log, { action: 'unplug', ids: {} }, { success: false, leak: 'LEAK_BODY' }, view);
    assert.ok(!/LEAK_/.test(JSON.stringify(log.lines)));
    FMT.dropLog('prov_trip');
});

test('every class is one of the five, and no template says simulated', () => {
    const texts = [...SC.TEMPLATES, ...FW.TEMPLATES, ...FMT.TERMINAL_ONLY_TEXT, ...GR.GRAMMAR_TEXT];
    for (const t of texts) assert.ok(!/\bsimulated\b/i.test(t), t);
    for (const name of names) {
        const view = viewOf(name);
        for (const c of calls(view)) {
            for (const l of c.lines) for (const s of l) {
                assert.ok(!/\bsimulated\b/i.test(s.text), s.text);
                assert.ok(!/simulation/i.test(s.text), `${s.text}: a generator never says simulation`);
            }
        }
        for (const l of FMT.formatListing(view)) for (const s of l) assert.ok(!/\bsimulated\b/i.test(s.text));
    }
    // the only fixed answers that say "in this simulation" are the grammar's listed ones
    for (const t of texts.filter(x => /simulation/i.test(x))) assert.ok(GR.GRAMMAR_TEXT.includes(t), t);
    for (const t of GR.GRAMMAR_TEXT.filter(x => /simulation/i.test(x))) assert.ok(/in this simulation|not part of this simulation|simulation\.$/i.test(t), t);
});

test('the check itself rejects a span nobody printed', () => {
    const atoms = atomsFor(viewOf('findings_states')).sort((a, b) => b.length - a.length);
    assert.equal(explained('Brand new sentence', atoms), false);
    assert.equal(explained('Host is up.', atoms), true);
    assert.equal(explained('   ', atoms), true);
});
