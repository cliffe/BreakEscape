// terminal-format.js and cli-gen/registry.js (Ops S6 unit 13): the trip's log and the plain layouts.
// Run with: node test/js/network-terminal-format.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const NV = join(here, '../../public/break_escape/js/minigames/network-view');
const load = (f) => import(pathToFileURL(join(NV, f)));
const FMT = await load('terminal-format.js');
const REG = await load('cli-gen/registry.js');
const OM = await load('ops-model.js');
const VT = await load('view-texts.js');
const SC = await load('cli-gen/scanner-output.js');
const FW = await load('cli-gen/framework-console.js');
const GR = await load('terminal-grammar.js');
const CODES = JSON.parse(readFileSync(join(here, '../fixtures/files/ops_refusal_codes.json'), 'utf8'));

const fx = (name) => JSON.parse(readFileSync(join(here, 'fixtures/network-view', `${name}.json`), 'utf8'));
const viewOf = (name) => { const d = fx(name); return { ...d.footholds[0], techniques: d.techniques || fx('techniques').techniques }; };
const clone = (v) => JSON.parse(JSON.stringify(v));
const text = (lines) => lines.map(l => l.map(s => s.text).join(''));
const flat = (lines) => text(lines).join('\n');
const CLASSES = ['prompt', 'head', 'ok', 'bad', 'note'];

const swept = viewOf('swept_hosts');
const states = viewOf('findings_states');
const tech = viewOf('techniques');
let n = 0;
const fresh = () => FMT.logFor(`trip_${(n += 1)}`, { create: true });

const sweepOffer = { action: 'sweep', target: 'lab_net', ids: { networkId: 'lab_net' } };
const scanOffer = { action: 'scan', target: 'print01', ids: { hostId: 'print01' } };
const checkOffer = { action: 'check', target: 'print01:web', ids: { hostId: 'print01', service: 'web' } };
const fid = (alias) => OM.findFinding(states, alias).finding.id;
const confirmOffer = (alias) => ({ action: 'confirm', target: fid(alias), ids: { findingId: fid(alias) } });
const useOffer = (alias, t = 'phish') => ({ action: 'use', target: { card: t, finding: fid(alias) }, ids: { findingId: fid(alias), techniqueId: t, itemId: `card_${t}` } });
const row = (v, id) => [...v.hosts, ...(v.networks || []).flatMap(b => b.hosts || [])].find(r => r.id === id);

test('the registry maps exactly five actions', () => {
    assert.deepEqual(Object.keys(REG.GENERATORS).sort(), ['check', 'confirm', 'scan', 'sweep', 'use']);
    assert.ok(Object.isFrozen(REG.GENERATORS));
    for (const a of ['sweep', 'scan', 'check']) assert.equal(REG.generatorFor(a), SC);
    for (const a of ['confirm', 'use']) assert.equal(REG.generatorFor(a), FW);
    for (const a of ['sign-in', 'open', 'observe', 'unplug', 'toString', '__proto__', null, undefined]) assert.equal(REG.generatorFor(a), null);
});

test('a new log holds the opening line, and logFor without create makes none', () => {
    assert.equal(FMT.logFor('no_such_trip'), null);
    assert.equal(FMT.logFor('no_such_trip', { create: false }), null);
    assert.equal(FMT.logFor(''), null);
    const log = fresh();
    assert.deepEqual(text(log.lines), ['Type help, or pick a command below.']);
    assert.equal(FMT.logFor(`trip_${n}`), log);
    assert.equal(FMT.logFor(`trip_${n}`, { create: true }), log, 'one log per foothold');
});

test('recordSent writes the echo, then started, before any answer', () => {
    const log = fresh();
    FMT.recordSent(log, sweepOffer, undefined, swept);
    const t = text(log.lines);
    assert.equal(t.length, 3);
    assert.equal(t[1], '$ nmap -sn lab_net');
    assert.deepEqual(log.lines[1].map(s => s.cls), ['prompt', undefined]);
    assert.deepEqual(log.lines.slice(2), SC.started(sweepOffer, swept));
    const log2 = fresh();
    FMT.recordSent(log2, confirmOffer('f1'), undefined, states);
    assert.ok(text(log2.lines)[1].startsWith('msf > use '), 'the framework line carries its own mark');
    assert.equal(log2.lines[1][0].cls, 'prompt');
    assert.deepEqual(log2.lines.slice(2), FW.started(confirmOffer('f1'), states));
});

test('an echo is used as given', () => {
    const log = fresh();
    FMT.recordSent(log, scanOffer, 'scan print01', swept);
    assert.equal(text(log.lines)[1], '$ scan print01');
    FMT.recordSent(log, confirmOffer('f1'), 'msf (training/x) > check', states);
    assert.deepEqual(log.lines[3].slice(0, 1), [{ text: 'msf (training/x) > ', cls: 'prompt' }]);
});

test('recordResult writes the result once, directly after the sent lines', () => {
    const log = fresh();
    const answer = { success: true, host: clone(row(swept, 'print01')) };
    FMT.recordSent(log, scanOffer, undefined, swept);
    const before = log.lines.length;
    FMT.recordResult(log, scanOffer, answer, swept);
    assert.deepEqual(log.lines.slice(before), SC.result(scanOffer, answer, swept));
    assert.equal(log.lines.length, before + SC.result(scanOffer, answer, swept).length);
});

test('one layout per answer shape', () => {
    const cases = [
        [sweepOffer, { success: true, network: { id: 'lab_net', swept: true, hosts: clone(swept.hosts) } }, swept, 'Nmap done'],
        [scanOffer, { success: true, host: clone(row(swept, 'print01')) }, swept, 'Brackley PrintPanel'],
        [checkOffer, { success: true, hostId: 'print01', service: 'web', findings: [] }, swept, VT.NO_FINDINGS_TEXT],
        [confirmOffer('f2'), { success: true, finding: OM.findFinding(states, 'f2').finding }, states, 'vulnerable'],
        [confirmOffer('f3'), { success: true, finding: OM.findFinding(states, 'f3').finding }, states, 'not vulnerable'],
        [useOffer('f1'), { success: true, grant: 'session', session: { displayName: 'Sam' } }, states, 'Sam'],
        [useOffer('f1'), { success: true, grant: 'session', session: { displayName: 'Sam', access: 'admin' } }, states, 'admin'],
        [useOffer('f1'), { success: true, grant: 'credential' }, states, 'saved sign-in'],
        [useOffer('f1'), { success: true, grant: 'session', already: true, session: { displayName: 'Sam' } }, states, 'You now hold a session']
    ];
    for (const [offer, answer, view, expect] of cases) {
        const log = fresh();
        FMT.recordSent(log, offer, undefined, view);
        FMT.recordResult(log, offer, answer, view);
        assert.ok(flat(log.lines).includes(expect), `${offer.action}: ${expect}`);
        assert.ok(log.lines.every(l => l.every(s => typeof s.text === 'string' && (s.cls === undefined || CLASSES.includes(s.cls)))));
    }
});

test('a refusal writes its words and no table', () => {
    for (const offer of [sweepOffer, scanOffer, checkOffer, confirmOffer('f1'), useOffer('f1')]) {
        for (const code of [...CODES, 'a_code_nobody_sent']) {
            const log = fresh();
            FMT.recordSent(log, offer, undefined, states);
            const before = log.lines.length;
            FMT.recordResult(log, offer, { success: false, reason: code }, states);
            const added = text(log.lines.slice(before));
            assert.equal(added.length, 1, `${offer.action} ${code}`);
            assert.ok(added[0].includes(OM.refusalText(code)), `${offer.action} ${code}`);
        }
    }
    const log = fresh();
    FMT.recordResult(log, useOffer('f1'), { success: false, reason: 'need_unmet', need: { label: 'Admin login' } }, states);
    assert.ok(flat(log.lines).includes('Missing: Admin login'));
});

test('a null answer writes the Panels no-reply sentence and no table', () => {
    for (const offer of [sweepOffer, scanOffer, checkOffer, confirmOffer('f1'), useOffer('f1')]) {
        const log = fresh();
        FMT.recordSent(log, offer, undefined, states);
        const before = log.lines.length;
        FMT.recordResult(log, offer, null, states);
        // The words the Panels notice says (the row's own sentence is drawn by `show` from the scene's rowNotice)
        const rowToo = ['sweep', 'scan'].includes(offer.action) ? [VT.REQUEST_FAILED_TEXT] : [];
        assert.deepEqual(text(log.lines.slice(before)), [...rowToo, OM.REFUSAL_TEXT.no_answer], offer.action);
    }
});

test('a failed unplug writes the unplug sentence; a good one writes nothing', () => {
    const offer = { action: 'unplug', target: 'port_a', ids: {} };
    const log = fresh();
    FMT.recordSent(log, offer, undefined, swept);
    assert.deepEqual(text(log.lines), ['Type help, or pick a command below.', '$ unplug']);
    FMT.recordResult(log, offer, null, swept);
    FMT.recordResult(log, offer, { success: false, message: 'The box is still in use.' }, swept);
    FMT.recordResult(log, offer, { success: false }, swept);
    FMT.recordResult(log, offer, { action: 'unplugged', footholdId: 'f', endedPcIds: [] }, swept);
    FMT.recordResult(log, offer, { action: 'not_planted', message: 'Nothing is plugged in here.' }, swept);
    assert.deepEqual(text(log.lines).slice(2), [
        OM.unplugNoticeText(null), 'The box is still in use.', OM.unplugNoticeText({})
    ]);
    assert.ok(log.lines.slice(2).every(l => l.length === 1 && l[0].cls === 'bad'));
});

test('an action with no registry entry writes the echo only', () => {
    for (const offer of [
        { action: 'sign-in', target: 'desk_pc', ids: { hostId: 'desk_pc' } },
        { action: 'open', target: 'desk_pc', ids: { hostId: 'desk_pc' } }
    ]) {
        const log = fresh();
        FMT.recordSent(log, offer, undefined, swept);
        assert.equal(log.lines.length, 2);
        assert.equal(text(log.lines)[1], `$ ${CommandVerb(offer)} desk_pc`);
        FMT.recordResult(log, offer, undefined, swept);
        assert.equal(log.lines.length, 2, 'nothing more when there is no answer to print');
    }
});
function CommandVerb(offer) { return offer.action === 'sign-in' ? 'signin' : 'open'; }

test('Look prints the observations, or the plain sentence', () => {
    const v = clone(swept);
    v.hosts.push({ id: 'note_board', kind: 'printer', name: 'Notice board', host: 'LAB-PRN', observations: 'A note about the rota.' });
    const log = fresh();
    const offer = { action: 'observe', target: 'note_board', ids: { resourceId: 'note_board' } };
    FMT.recordSent(log, offer, undefined, v);
    FMT.recordResult(log, offer, undefined, v);
    assert.deepEqual(text(log.lines).slice(1), ['$ look note_board', 'Notice board', 'A note about the rota.']);
    assert.deepEqual(text(FMT.lookLines({ id: 'x', name: 'X' })), ['X', 'Nothing more to see from here.']);
    assert.deepEqual(text(FMT.lookLines({ id: 'x', name: 'X' }, 'A notice.')), ['X', 'A notice.']);
});

test('a call after dropLog writes nothing and makes no log', () => {
    const log = fresh();
    const id = log.footholdId;
    FMT.dropLog(id);
    const count = log.lines.length;
    FMT.recordSent(log, sweepOffer, undefined, swept);
    FMT.recordResult(log, sweepOffer, null, swept);
    assert.equal(FMT.appendLine(log, [{ text: 'x' }]), false);
    assert.equal(log.lines.length, count);
    assert.equal(FMT.logFor(id), null);
    FMT.recordSent(null, sweepOffer, undefined, swept);
    FMT.recordResult(undefined, sweepOffer, null, swept);
    assert.equal(FMT.logFor(id), null, 'no log was created');
    assert.notEqual(FMT.logFor(id, { create: true }), log, 'a new trip starts a new log');
});

test('the log is capped at 300 lines, oldest dropped, and the opening line goes with them', () => {
    const log = fresh();
    for (let i = 0; i < 350; i += 1) FMT.appendLine(log, [{ text: `line ${i}` }]);
    assert.equal(log.lines.length, 300);
    assert.equal(log.lines[0][0].text, 'line 50');
    assert.equal(log.lines[299][0].text, 'line 349');
});

test('control characters become U+FFFD and add no line', () => {
    const log = fresh();
    const nasty = ['\u0000', '\u0007', '\n', '\r', '\u001B', '\u001F', '\u007F', '\u0085', '\u009F', '\u2028', '\u2029',
        '\u202A', '\u202B', '\u202C', '\u202D', '\u202E', '\u2066', '\u2067', '\u2068', '\u2069'];
    const before = log.lines.length;
    FMT.appendLine(log, [{ text: `a${nasty.join('b')}c`, cls: 'note' }, { text: 'plain \u00A0 ok', cls: 'ok' }]);
    assert.equal(log.lines.length, before + 1);
    const [first, second] = log.lines[before];
    assert.equal(first.text, `a${nasty.map(() => '\uFFFD').join('b')}c`);
    assert.equal(first.cls, 'note');
    assert.equal(second.text, 'plain \u00A0 ok', 'a plain space and a no-break space stay');
    assert.ok(!/[\u0000-\u001F\u007F-\u009F\u2028\u2029\u202A-\u202E\u2066-\u2069]/.test(log.lines[before].map(s => s.text).join('')));
});

test('control characters in an echo or an answer are cleaned too, and the input is not changed', () => {
    const log = fresh();
    FMT.recordSent(log, scanOffer, 'scan print01\u001B[31m\nsecond', swept);
    assert.equal(log.lines.length, 3, 'a newline in an echo adds no line');
    assert.ok(text(log.lines)[1].includes('\uFFFD[31m\uFFFDsecond'));
    const spans = [{ text: 'x\u0000y', cls: 'weird' }];
    FMT.appendLine(log, spans);
    assert.equal(spans[0].text, 'x\u0000y');
    assert.deepEqual(log.lines[log.lines.length - 1], [{ text: 'x\uFFFDy' }], 'an unknown class is dropped');
    FMT.appendLine(log, 'not an array');
    FMT.appendLine(log, null);
});

// ---------------------------------------------------------------------------------------------
// The plain layouts
// ---------------------------------------------------------------------------------------------

test('show: hosts, services, findings, needs, techniques and shares are all listed', () => {
    for (const name of ['findings_states', 'techniques', 'host_states', 'pivot_locked', 'pivot_open', 'shares', 'swept_hosts', 'plain', 'admin_session']) {
        const v = viewOf(name);
        const all = flat(FMT.formatListing(v));
        const rows = [...v.hosts, ...(v.networks || []).flatMap(b => b.hosts || [])];
        for (const r of rows) {
            assert.ok(all.includes(r.kind === 'pc' ? (r.host || r.id) : (r.name || r.id)), `${name}: ${r.id}`);
            for (const s of OM.rowServices(r)) {
                assert.ok(all.includes(String(s.port)) && all.includes(s.product), `${name}: ${r.id} ${s.name}`);
                for (const f of OM.rowFindings(r, s.name)) {
                    for (const piece of [f.alias, OM.classWord(f.class), OM.severityWord(f.severity), OM.statusWord(f.status), OM.findingSummary(f), OM.falseReason(f)]) {
                        assert.ok(all.includes(piece), `${name}: ${f.alias} ${piece}`);
                    }
                    for (const need of OM.findingNeeds(f)) assert.ok(all.includes(OM.needLine(need)), `${name}: need ${need.label}`);
                    if (OM.isFixed(f)) assert.ok(all.includes(OM.FIXED_TEXT));
                }
            }
        }
        for (const t of OM.techniqueList(v)) assert.ok(all.includes(t.name) && all.includes(t.worksOn), `${name}: ${t.id}`);
    }
});

test('show: the headings, tables and marks', () => {
    const all = flat(FMT.formatListing(tech));
    for (const head of ['HOST', 'NAME', 'STATUS', 'SERVICE', 'PORT', 'PRODUCT', 'VERSION', 'TECHNIQUE', 'WORKS ON', 'Reachable', 'Techniques']) {
        assert.ok(all.includes(head), head);
    }
    const shares = flat(FMT.formatListing(viewOf('shares')));
    assert.ok(shares.includes('RESOURCE') && shares.includes(VT.SHARE_LOCKED_LABEL) && shares.includes(VT.SHARE_LOCKED_TEXT));
    const pivot = flat(FMT.formatListing(viewOf('pivot_locked')));
    assert.ok(pivot.includes(', through ') && pivot.includes('(Locked)'));
});

test('show: a settled finding shows its needs, the fixed mark and its reason', () => {
    const all = FMT.formatListing(states);
    const t = flat(all);
    assert.ok(t.includes('Fixed'));
    assert.ok(t.includes(OM.falseReason(OM.findFinding(states, 'f3').finding)));
    // a need's yes or no is its own span
    const needLines = all.filter(l => l.some(s => s.text === 'yes' || s.text === 'no'));
    for (const l of needLines) assert.ok(l.some(s => s.text === 'yes' || s.text === 'no'));
    assert.ok(all.some(l => l.some(s => s.text === 'Fixed')), 'Fixed is its own span');
    assert.ok(all.some(l => l.some(s => s.text === OM.statusWord('confirmed'))), 'a status word is its own span');
    assert.ok(all.some(l => l.some(s => s.text === OM.falseReason(OM.findFinding(states, 'f3').finding))), 'the reason is its own span');
});

test('show: status texts, down blocks and link lines', () => {
    const hs = flat(FMT.formatListing(viewOf('host_states')));
    for (const piece of [VT.POWERED_DOWN_TAG, VT.REMOTE_OFF_TEXT]) assert.ok(hs.includes(piece), piece);
    const pl = FMT.formatListing(viewOf('pivot_locked'), { status: 'Joined. Reaches 2 hosts.', message: 'A message.', stale: true, hint: 'A hint.', notice: 'A notice.' });
    const t = text(pl);
    assert.deepEqual(t.slice(0, 4), ['Joined. Reaches 2 hosts.', 'A message.', VT.STALE_TEXT, 'A hint.']);
    assert.equal(t[t.length - 1], 'A notice.');
    const off = clone(viewOf('plain'));
    off.responding = false; off.via = 'jack'; off.sourceHost = 'Box PC';
    assert.ok(flat(FMT.formatListing(off)).includes(VT.linkOffText('Box PC')));
    const down = clone(viewOf('pivot_open'));
    down.networks.find(b => b.route === 'up' && b.id !== down.network.id).route = 'down';
    assert.ok(flat(FMT.formatListing(down)).includes(VT.NO_ROUTE_TEXT));
    const empty = clone(viewOf('discovery_unswept'));
    assert.ok(flat(FMT.formatListing(empty)).includes(VT.SWEEP_HINT_TEXT));
});

test('show: a technique session and an admin session are marked', () => {
    const t = flat(FMT.formatListing(viewOf('technique_session')));
    assert.ok(t.includes(VT.COMPROMISED_TEXT));
    assert.ok(flat(FMT.formatListing(viewOf('admin_session'))).includes('admin'));
    const grant = flat(FMT.formatListing(tech, { lastGrant: { host: 'Web gateway', who: 'Sam', access: 'admin' } }));
    assert.ok(grant.includes(VT.sessionGrantText('Web gateway', 'Sam')) && grant.includes('admin'));
});

test('show lists nothing of a missing or empty view without throwing', () => {
    for (const v of [null, undefined, {}, { hosts: 'x', networks: 'y' }]) assert.doesNotThrow(() => FMT.formatListing(v));
    assert.ok(text(FMT.formatListing({})).includes('Nothing answers on this network.'));
});

test('localLines: one answer per grammar local name', () => {
    const shell = { prompt: 'shell', module: null, technique: null };
    const msf = { prompt: 'msf', module: fid('f1'), technique: 'phish' };
    const L = (name, args, mode) => FMT.localLines({ name, args }, states, mode, {});
    assert.deepEqual(L('help', { verb: null }, shell), GR.helpFor(null, shell).map((t, i) => (i === 0 ? [{ text: t, cls: 'head' }] : [{ text: t }])));
    assert.deepEqual(text(L('help', { verb: 'sweep' }, shell)), GR.helpFor('sweep', shell));
    assert.deepEqual(L('show', {}, shell), FMT.formatListing(states));
    assert.deepEqual(L('msfconsole', {}, msf), FW.banner());
    assert.deepEqual(L('msf.search', { word: 'cosmetic' }, msf), FW.search(states, 'cosmetic'));
    assert.deepEqual(L('msf.info', { findingId: fid('f2'), alias: 'f2' }, msf), FW.info(states, { ...msf, module: fid('f2') }));
    assert.deepEqual(L('msf.options', { findingId: fid('f1'), alias: 'f1' }, msf), FW.showOptions(states, msf));
    assert.deepEqual(L('msf.sessions', {}, msf), FW.sessions(states));
    assert.deepEqual(text(L('msf.set', { name: 'TECHNIQUE', value: 'phish' }, msf)), ['TECHNIQUE => phish']);
    assert.deepEqual(text(L('msf.unset', { name: 'TECHNIQUE' }, msf)), ['Unsetting TECHNIQUE...']);
    for (const name of ['clear', 'exit', 'panels', 'back', 'msf.use', 'nothing_known']) assert.deepEqual(L(name, {}, msf), [], name);
});

test('sweep.listed is the scanner layout of the rows already known', () => {
    const block = swept.networks[0];
    const lines = FMT.localLines({ name: 'sweep.listed', args: { networkId: block.id, block, rows: block.hosts } }, swept, { prompt: 'shell' });
    const offer = { action: 'sweep', target: block.id, ids: { networkId: block.id } };
    // R1-C4: the scanner's layout, then one note line saying nothing new was found
    const note = lines[lines.length - 1];
    assert.equal(note.length, 1);
    assert.equal(note[0].text, 'Every host here is already listed.');
    assert.deepEqual(lines.slice(0, -1), [...SC.started(offer, swept), ...SC.result(offer, { success: true, network: { id: block.id, swept: true, hosts: block.hosts } }, swept)]);
    assert.ok(flat(lines).includes('Nmap scan report for'));
    assert.ok(FMT.TERMINAL_ONLY_TEXT.includes('Every host here is already listed.'));
    assert.doesNotThrow(() => FMT.sweepListed(null, null));
});

test('TERMINAL_ONLY_TEXT holds what Panels never shows, and not the shared words', () => {
    const T = FMT.TERMINAL_ONLY_TEXT;
    assert.ok(Object.isFrozen(T));
    for (const piece of [FMT.OPENING_TEXT, FMT.STRIP_LABEL, FMT.CHANGE_LINE_TEXT, '$', 'msf >', ...SC.TEMPLATES, ...FW.TEMPLATES, ...GR.GRAMMAR_TEXT,
        'HOST', 'NAME', 'STATUS', 'SERVICE', 'PORT', 'PRODUCT', 'VERSION', 'TECHNIQUE', 'WORKS ON']) assert.ok(T.includes(piece), piece);
    assert.equal(FMT.OPENING_TEXT, 'Type help, or pick a command below.');
    assert.equal(FMT.STRIP_LABEL, 'Commands:');
    assert.equal(FMT.CHANGE_LINE_TEXT, '-- network changed. show lists it again --');
    const shared = [VT.REQUEST_FAILED_TEXT, OM.FIXED_TEXT, OM.ACCESS_TAG_TEXT, ...Object.values(OM.STATUS_WORDS), ...Object.values(OM.CLASS_WORDS), ...Object.values(OM.REFUSAL_TEXT), OM.UNKNOWN_REFUSAL_TEXT];
    for (const s of shared) assert.ok(!T.includes(s), s);
});

test('the format module is pure and draws no HTML', () => {
    const src = readFileSync(join(NV, 'terminal-format.js'), 'utf8') + readFileSync(join(NV, 'cli-gen/registry.js'), 'utf8');
    for (const word of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function', 'setTimeout', 'setInterval', 'localStorage', 'window.', 'document.', 'fetch(', 'Date.now', 'Math.random']) {
        assert.ok(!src.includes(word), word);
    }
});

test('R1-C14: the cap never cuts into the newest command: its echo stays above its output', () => {
    const log = fresh();
    for (let i = 0; i < 50; i++) FMT.appendLine(log, [{ text: `old ${i}` }]);
    FMT.appendLine(log, [{ text: '$ ', cls: 'prompt' }, { text: 'show' }]);
    for (let i = 0; i < FMT.LOG_CAP + 120; i++) FMT.appendLine(log, [{ text: `device ${i}` }]);
    assert.equal(log.lines[0].map(s => s.text).join(''), '$ show', 'the echo is the first line left');
    assert.equal(log.lines.length, FMT.LOG_CAP + 121);
    // the next command's echo lets the old one go
    FMT.appendLine(log, [{ text: '$ ', cls: 'prompt' }, { text: 'help' }]);
    for (let i = 0; i < 5; i++) FMT.appendLine(log, [{ text: `h ${i}` }]);
    assert.equal(log.lines.length, FMT.LOG_CAP);
    assert.ok(log.lines.some(l => l.map(s => s.text).join('') === '$ help'));
});

test('R2-8: past a hard ceiling the oldest lines go, whatever they are', () => {
    const log = fresh();
    FMT.appendLine(log, [{ text: '$ ', cls: 'prompt' }, { text: 'show' }]);
    for (let i = 0; i < FMT.LOG_HARD_CAP * 2; i++) FMT.appendLine(log, [{ text: `matches ${i}` }]);
    assert.ok(log.lines.length <= FMT.LOG_HARD_CAP, String(log.lines.length));
    assert.equal(log.lines[log.lines.length - 1].map(s => s.text).join(''), `matches ${FMT.LOG_HARD_CAP * 2 - 1}`);
});

test('R1-C17: an echo recognises the prompt as the grammar reads it: any case, any spacing, a path with a bracket', () => {
    for (const [typed, mark, rest] of [['MSF> check', 'MSF>', 'check'], ['msf  > check', 'msf  >', 'check'], ['msf (a)b) > check', 'msf (a)b) >', 'check'], ['$ show', '$', 'show']]) {
        const log = fresh();
        FMT.recordSent(log, { action: 'open', ids: {} }, typed, null);
        const line = log.lines[log.lines.length - 1];
        assert.deepEqual(line.map(s => s.text), [`${mark} `, rest], typed);
        assert.equal(line[0].cls, 'prompt');
    }
    const log = fresh();
    FMT.recordSent(log, { action: 'open', ids: {} }, 'open x', null);
    assert.deepEqual(log.lines[log.lines.length - 1].map(s => s.text), ['$ ', 'open x']);
});

// ---------------------------------------------------------------------------------------------
// Ranges and addresses (K3e): the view is shaped as the server sent it for the guest network
// (playtest capture of GET network after a session on files01: a device row with no `host`, `cli.range` on the block)
// ---------------------------------------------------------------------------------------------

const served = {
    id: 'jack_office_port',
    name: 'Drop box: Lobby',
    network: { id: 'office_lan', name: 'Office network' },
    hosts: [
        { id: 'files01', kind: 'pc', name: 'File server', host: 'FILES01', sprite: 'pc_desktop', headless: true, address: '10.20.0.10', scanned: true, remoteSignIn: true },
        { id: 'records01', kind: 'pc', name: 'Records server', host: 'RECORDS01', sprite: 'pc_desktop', headless: true, remoteSignIn: false }
    ],
    networks: [
        {
            id: 'guest_lan', name: 'Guest network', via: { hostId: 'files01', host: 'FILES01', displayName: 'Ian Okafor' },
            hosts: [{ id: 'guest_cam01', kind: 'device', name: 'Guest lounge camera', sprite: 'cctv_camera1', address: '10.40.0.4' }],
            route: 'up', cli: { range: '10.40.0.0/28' }, ops: true
        },
        {
            id: 'office_lan', name: 'Office network', via: null, route: 'up', cli: { range: '10.20.0.0/24' }, ops: true,
            hosts: [
                { id: 'files01', kind: 'pc', name: 'File server', host: 'FILES01', address: '10.20.0.10', scanned: true, remoteSignIn: true },
                { id: 'records01', kind: 'pc', name: 'Records server', host: 'RECORDS01', remoteSignIn: false }
            ]
        }
    ]
};

test('show: a linked network lists its range and its hosts addresses, as the own network does', () => {
    const lines = text(FMT.formatListing(served));
    const all = lines.join('\n');
    assert.ok(lines.includes('Reachable (10.20.0.0/24)'), all);
    assert.ok(lines.some(l => l.startsWith('Guest network (10.40.0.0/28), through FILES01')), all);
    assert.ok(lines.some(l => l.includes('FILES01') && l.includes('10.20.0.10')), all);
    assert.ok(lines.some(l => l.includes('Guest lounge camera') && l.includes('10.40.0.4')), all);
    assert.ok(lines.some(l => l.includes('ADDRESS')), 'the table names its column');
});

test('show: with no address or range served the listing is the old one', () => {
    const plain = clone(served);
    for (const b of plain.networks) { delete b.cli; for (const r of b.hosts) delete r.address; }
    for (const r of plain.hosts) delete r.address;
    const all = flat(FMT.formatListing(plain));
    assert.ok(!all.includes('ADDRESS') && !all.includes('10.'), all);
});

// ---------------------------------------------------------------------------------------------
// One span per cell (Ops follow-up B3)
// ---------------------------------------------------------------------------------------------

/** The table lines of a list of lines: those holding at least one cell span (a span with a width). */
const cellLines = (lines) => lines.filter(l => l.some(s => s.w !== undefined));
/** Checks that hold for every table: one span per cell, one space, no layout by spaces, equal widths down a column. */
function assertCells(lines, label) {
    const rows = cellLines(lines);
    assert.ok(rows.length >= 2, `${label}: a head and a row`);
    const cells = rows.map(l => l.filter(s => s.w !== undefined));
    for (const r of cells) {
        for (const s of r) {
            assert.ok(Number.isInteger(s.w) && s.w >= 1 && s.w <= 80, `${label}: w ${s.w}`);
            assert.ok(s.text.endsWith(' ') && !s.text.endsWith('  ') && !/ {2}/.test(s.text), `${label}: one space in ${JSON.stringify(s.text)}`);
            assert.ok(s.w >= s.text.length + 1 || s.w === 80, `${label}: w holds the value and a gap`);
        }
    }
    // each run of table lines (a table) has one width per column
    let runFirst = null;
    lines.forEach((l, i) => {
        const own = l.filter(s => s.w !== undefined);
        if (!own.length) { runFirst = null; return; }
        if (!runFirst || (l.some(s => s.cls === 'head') && own.length && !(lines[i - 1] || []).some(s => s.w !== undefined))) runFirst = own;
        own.forEach((s, k) => assert.equal(s.w, runFirst[k].w, `${label}: column ${k}`));
    });
    for (const l of rows) for (const s of l) assert.ok(!/ {2}/.test(s.w === undefined ? s.text.trim() : s.text), `${label}: no padding spaces`);
}

test('tables: one span per cell with a width, equal down every column', () => {
    assertCells(FMT.formatListing(swept), 'listing');
    assertCells(FMT.formatListing(tech), 'techniques');
    const serviced = FMT.formatListing(states);
    assert.ok(cellLines(serviced).length > 0);
});

test('tables: a cell with a control character still has it replaced, and the width stays', () => {
    const v = clone(swept);
    const target = [...v.hosts, ...(v.networks || []).flatMap(b => b.hosts || [])].find(r => r.kind === 'pc');
    target.name = 'Ann\u001B[31mX';
    const log = fresh();
    for (const l of FMT.formatListing(v)) FMT.appendLine(log, l);
    const t = text(log.lines).join('\n');
    assert.ok(log.lines.some(l => l.some(s => s.w !== undefined)));
    assert.ok(!t.includes('\u001B'));
    assert.ok(t.includes('Ann�[31mX'));
});

test('appendLine keeps a good w and drops a bad one', () => {
    const log = fresh();
    const base = log.lines.length;
    for (const w of [1, 6, 80]) FMT.appendLine(log, [{ text: 'a ', w }]);
    for (const w of [0, 81, 2.5, '6', null, NaN, -3, Infinity]) FMT.appendLine(log, [{ text: 'a ', w }]);
    const got = log.lines.slice(base).map(l => l[0]);
    assert.deepEqual(got.slice(0, 3).map(s => s.w), [1, 6, 80]);
    for (const s of got.slice(3)) assert.ok(!('w' in s), `dropped ${JSON.stringify(s)}`);
});

test('the log reads as cells joined by single spaces, and the cap still holds', () => {
    const log = fresh();
    FMT.appendLine(log, [{ text: 'PORT ', w: 7 }, { text: 'STATE ', w: 8 }, { text: 'SERVICE' }]);
    assert.equal(text(log.lines).at(-1), 'PORT STATE SERVICE');
    for (let i = 0; i < 400; i += 1) FMT.appendLine(log, [{ text: `c${i} `, w: 6 }, { text: 'x' }]);
    assert.ok(log.lines.length <= 300, 'the cap holds');
});
