// The scanner generator (Ops S6 unit 10): sweep, scan and check text for the Terminal, pinned by
// golden files under test/js/fixtures/network-view/cli-golden/scanner/.
// Golden format: `[cls|text]` per classed span, bare text when unclassed (the framework test uses the same).
// Run with: node test/js/cli-gen-scanner.test.mjs   (GOLDEN_WRITE=1 writes the golden files)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import * as AU from './support/cli-authored.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const nv = join(here, '../../public/break_escape/js/minigames/network-view');
const fixtures = join(here, 'fixtures/network-view');
const golden = join(fixtures, 'cli-golden/scanner');
const dir = mkdtempSync(join(tmpdir(), 'cli-gen-scanner-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'nv/cli-gen'), { recursive: true });
for (const f of ['ops-model.js', 'view-texts.js', 'view-controls.js', 'cli-gen/defaults.js', 'cli-gen/scanner-output.js']) {
    writeFileSync(join(dir, 'nv', f), readFileSync(join(nv, f), 'utf8'));
}
const gen = await import(pathToFileURL(join(dir, 'nv/cli-gen/scanner-output.js')));
const { downState } = await import(pathToFileURL(join(dir, 'nv/view-controls.js')));
const texts = await import(pathToFileURL(join(dir, 'nv/view-texts.js')));
const model = await import(pathToFileURL(join(dir, 'nv/ops-model.js')));

const load = (name) => JSON.parse(readFileSync(join(fixtures, `${name}.json`), 'utf8')).footholds[0];
const clone = (v) => JSON.parse(JSON.stringify(v));
const render = (lines) => lines.map(l => l.map(s => (s.w ? `[${s.cls || ''}@${s.w}|${s.text}]` : (s.cls ? `[${s.cls}|${s.text}]` : s.text))).join('')).join('\n') + '\n';

const sweepOffer = (id) => ({ action: 'sweep', target: id, ids: { networkId: id } });
const scanOffer = (id) => ({ action: 'scan', target: id, ids: { hostId: id } });
const checkOffer = (host, service) => ({ action: 'check', target: `${host}:${service}`, ids: { hostId: host, service } });
const sweepAnswer = (v, id = 'lab_net') => ({ success: true, network: { id, swept: true, hosts: clone(v.hosts) } });
const scanAnswer = (v, id) => ({ success: true, host: clone(v.hosts.find(h => h.id === id)) });
const checkAnswer = (v, id, service) => ({
    success: true, hostId: id, service,
    findings: clone(v.hosts.find(h => h.id === id).findings || []).filter(f => f.service === service)
});
const withRange = (v, range) => { const c = clone(v); c.networks[0] = { ...c.networks[0], cli: { range } }; return c; };

/** [fixture, step, view, offer, answer] for every golden file. */
const cases = [];
const names = readdirSync(fixtures).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).filter(n => !AU.AUTHORED.includes(n)).sort();
for (const name of names) {
    const v = load(name);
    if (!Array.isArray(v.hosts) || !v.hosts.some(h => h.kind === 'pc' || h.kind === 'device')) continue;
    cases.push([name, 'sweep', v, sweepOffer('lab_net'), sweepAnswer(v)]);
    for (const h of v.hosts) {
        if (h.scanned !== true || !Array.isArray(h.services)) continue;
        cases.push([name, `scan.${h.id}`, v, scanOffer(h.id), scanAnswer(v, h.id)]);
        for (const s of h.services) cases.push([name, `check.${h.id}.${s.name}`, v, checkOffer(h.id, s.name), checkAnswer(v, h.id, s.name)]);
    }
}
{
    const v = load('swept_hosts');
    cases.push(['swept_hosts', 'sweep-24', withRange(v, '10.20.30.0/24'), sweepOffer('lab_net'), sweepAnswer(v)]);
    cases.push(['swept_hosts', 'sweep-30', withRange(v, '10.20.30.0/30'), sweepOffer('lab_net'), sweepAnswer(v)]);
    const one = clone(v); one.hosts = one.hosts.slice(0, 1);
    cases.push(['swept_hosts', 'sweep-single-no-range', one, sweepOffer('lab_net'), sweepAnswer(one)]);
    cases.push(['swept_hosts', 'sweep-single-32', withRange(one, '10.20.30.7/32'), sweepOffer('lab_net'), sweepAnswer(one)]);
    cases.push(['swept_hosts', 'sweep-empty-range', withRange(one, '10.20.30.0/24'), sweepOffer('lab_net'), { success: true, network: { id: 'lab_net', swept: true, hosts: [] } }]);
    cases.push(['swept_hosts', 'check-empty', v, checkOffer('print01', 'web'), checkAnswer(v, 'print01', 'web')]);
    const addr = clone(v); addr.hosts[0].address = '10.20.30.4'; addr.hosts[1].address = '10.20.30.5';
    cases.push(['swept_hosts', 'sweep-addresses', addr, sweepOffer('lab_net'), sweepAnswer(addr)]);
    cases.push(['swept_hosts', 'scan-address', addr, scanOffer('print01'), scanAnswer(addr, 'print01')]);
    const banner = clone(v); banner.hosts[1].services.push({ name: 'files', label: 'file share', port: 445, product: 'Brackley ShareServe', version: '3.1', cli: { banner: 'ShareServe ready' } });
    cases.push(['swept_hosts', 'scan-banner', banner, scanOffer('print01'), scanAnswer(banner, 'print01')]);
    cases.push(['swept_hosts', 'refusal', v, scanOffer('print01'), { success: false, reason: 'not_responding' }]);
    cases.push(['swept_hosts', 'refusal-unknown-code', v, sweepOffer('lab_net'), { success: false, reason: 'something_new' }]);
    cases.push(['swept_hosts', 'null-answer', v, scanOffer('print01'), null]);
    const h = load('host_states');
    cases.push(['host_states', 'sweep-24-down', withRange(h, '10.20.30.0/24'), sweepOffer('lab_net'), sweepAnswer(h)]);
    const f = load('findings_states');
    cases.push(['findings_states', 'check-refused', f, checkOffer('print01', 'web'), { success: false, reason: 'not_responding' }]);
}

for (const [name, step, view, offer, answer] of cases) {
    test(`golden ${name}.${step}`, () => {
        const text = render([...gen.started(offer, view), ...gen.result(offer, answer, view)]);
        const file = join(golden, `${name}.${step}.txt`);
        if (process.env.GOLDEN_WRITE === '1') { mkdirSync(golden, { recursive: true }); writeFileSync(file, text); }
        assert.ok(existsSync(file), `missing golden ${name}.${step}.txt`);
        assert.equal(text, readFileSync(file, 'utf8'));
        assert.deepEqual(gen.result(offer, answer, view), gen.result(offer, answer, view), 'called twice, equal lines');
    });
}

// The authored `cli` fixtures (unit 24): each move's golden is the echo, the `started` lines and the result, built from the
// view the scene holds before that move (see support/cli-authored.mjs for which answer carries which authored text).
const authored = [];
for (const name of AU.AUTHORED) {
    const ans = AU.answers(name);
    authored.push([name, 'sweep.office_lan', AU.stageView(name, 'sweep'), AU.sweepOffer('office_lan'), ans.sweep()]);
    authored.push([name, 'scan.files01', AU.stageView(name, 'scan'), AU.scanOffer('files01'), ans.scan('files01')]);
    authored.push([name, 'scan.guest_cam01', AU.stageView(name, 'scan'), AU.scanOffer('guest_cam01'), ans.scan('guest_cam01')]);
    authored.push([name, 'check.files01.storage', AU.stageView(name, 'check'), AU.checkOffer('files01', 'storage'), ans.check('files01', 'storage')]);
    authored.push([name, 'check.guest_cam01.stream', AU.stageView(name, 'check'), AU.checkOffer('guest_cam01', 'stream'), ans.check('guest_cam01', 'stream')]);
}
for (const [name, step, view, offer, answer] of authored) {
    test(`golden ${name}.${step}`, () => {
        const text = AU.show(AU.moveLines(view, offer, answer));
        const file = join(golden, `${name}.${step}.txt`);
        if (process.env.GOLDEN_WRITE === '1') { mkdirSync(golden, { recursive: true }); writeFileSync(file, text); }
        assert.ok(existsSync(file), `missing golden ${name}.${step}.txt`);
        assert.equal(text, readFileSync(file, 'utf8'));
        assert.deepEqual(AU.moveLines(view, offer, answer), AU.moveLines(view, offer, answer), 'called twice, equal lines');
    });
}

test('authored fixtures: the address, the udp flag, the banner and the range reach the lines', () => {
    for (const name of AU.AUTHORED) {
        const text = (step) => AU.show(AU.moveLines(...(authored.find(([n, s]) => n === name && s === step).slice(2))));
        assert.match(text('sweep.office_lan'), /Starting Nmap against 10\.20\.0\.0\/24/);
        assert.match(text('sweep.office_lan'), /\[head\|files01\]\[head\| \(10\.20\.0\.10\)\]/);
        assert.match(text('sweep.office_lan'), /\[head\|records01\]\n/);
        assert.match(text('sweep.office_lan'), /Nmap done: 256 IP addresses \(2 hosts up\) scanned/);
        assert.match(text('scan.files01'), /445\/tcp\s+open\s+filehold/);
        assert.match(text('scan.files01'), /\[note\|\|_banner: \]Tarnwick FileHold 4\.2 file service ready/);
        assert.match(text('scan.guest_cam01'), /554\/udp\s+open\s+viewline/);
        assert.match(text('check.guest_cam01.stream'), /\$ \]nmap -sV --script vuln -sU -p 554 guest_cam01/);
        assert.match(text('check.files01.storage'), /\$ \]nmap -sV --script vuln -p 445 files01\n/);
    }
    const full = AU.show(AU.moveLines(...authored.find(([n, s]) => n === 'cli_authored_entries' && s === 'check.files01.storage').slice(2)));
    assert.match(full, /\[note\|IDs: \]TRN-0000-0101 TRN-0000-0102/);
    assert.match(full, /\[note\|\|     \]build: 4\.2 \(fix level lagging\)/);
    const bare = AU.show(AU.moveLines(...authored.find(([n, s]) => n === 'cli_authored_bare' && s === 'check.files01.storage').slice(2)));
    assert.doesNotMatch(bare, /IDs:/);
    assert.match(bare, /\[note\|\|   \]Storage service behind its fixes/);
});

test('every golden file has a case', () => {
    const want = new Set([...cases, ...authored].map(([n, s]) => `${n}.${s}.txt`));
    for (const f of readdirSync(golden)) assert.ok(want.has(f), `stray golden ${f}`);
});

const allLines = () => cases.flatMap(([, , view, offer, answer]) => [...gen.started(offer, view), ...gen.result(offer, answer, view)]);

test('shape: lines are arrays of spans with an allowed class', () => {
    for (const l of allLines()) {
        assert.ok(Array.isArray(l));
        for (const s of l) {
            assert.equal(typeof s.text, 'string');
            assert.ok(s.cls === undefined || ['prompt', 'head', 'ok', 'bad', 'note'].includes(s.cls), s.cls);
        }
    }
});

test('nothing invented: no timestamps, latency, MAC, OS guess, closed ports or "(simulated)"', () => {
    const all = allLines().map(l => l.map(s => s.text).join('')).join('\n');
    for (const bad of [/simulated/i, /latency/i, /MAC Address/i, /OS details|Running:|OS:/, /\d{4}-\d\d-\d\d/, /closed/i, /filtered/i, /scanned in/i]) assert.doesNotMatch(all, bad);
    for (const t of gen.TEMPLATES) assert.doesNotMatch(t, /simulated/i);
});

test('the sweep row status mirrors downState for rows of an up network', () => {
    const v = load('host_states');
    for (const row of v.hosts) {
        const ds = downState(row);
        const lines = gen.result(sweepOffer('lab_net'), { success: true, network: { id: 'lab_net', hosts: [row] } }, v).map(l => l.map(s => s.text).join(''));
        assert.equal(lines.includes('Host seems down.'), ds.down, row.id);
        for (const t of [ds.tag, ds.reason].filter(Boolean)) assert.ok(lines.includes(`  Status: ${t}`), `${row.id} ${t}`);
    }
});

test('a kept session and an account with the admin tag are their own spans', () => {
    const v = load('host_states');
    const kept = { ...v.hosts[2], heldAs: 'Sam', session: { username: 'sam', displayName: 'Sam', access: 'admin' } };
    const keptOut = gen.result(sweepOffer('lab_net'), { success: true, network: { id: 'lab_net', hosts: [kept] } }, v).map(l => l.map(s => s.text).join(''));
    assert.ok(keptOut.includes(`  Status: ${texts.sessionKeptText('Sam')}`));
    // R1-C11: a row Panels show as powered down names no account
    assert.ok(!keptOut.some(l => l.startsWith('  Account:')));
    const row = { ...v.hosts[2], kind: 'pc', responding: true, remoteSignIn: true, session: { username: 'sam', displayName: 'Sam', access: 'admin' } };
    const out = gen.result(sweepOffer('lab_net'), { success: true, network: { id: 'lab_net', hosts: [row] } }, v);
    const flat = out.map(l => l.map(s => s.text).join(''));
    assert.ok(flat.includes('  Account: Sam admin'));
    const acct = out.find(l => l[0].text === '  Account: ');
    assert.deepEqual(acct.map(s => s.text), ['  Account: ', 'Sam', ' admin']);
    // R1-C11: a locked session shows Locked and never the name, as Panels do
    const locked = { ...row, session: { ...row.session, locked: true } };
    const lockedOut = gen.result(sweepOffer('lab_net'), { success: true, network: { id: 'lab_net', hosts: [locked] } }, v).map(l => l.map(s => s.text).join(''));
    assert.ok(lockedOut.includes('  Status: Locked'));
    assert.ok(!lockedOut.some(l => l.includes('Sam')));
});

test('a served finding cli supplies the script, title, advisories and output', () => {
    const v = load('findings_states');
    const answer = checkAnswer(v, 'print01', 'web');
    answer.findings[0].cli = { title: 'Invented title', script: 'invented-script', advisories: ['TRAIN-0000-0001', 'TRAIN-0000-0002'], output: ['first line', 'second line'] };
    const lines = gen.result(checkOffer('print01', 'web'), answer, v).map(l => l.map(s => s.text).join(''));
    const at = lines.indexOf('| invented-script:');
    assert.ok(at > 0);
    assert.deepEqual(lines.slice(at, at + 9), [
        '| invented-script:', '|   Invented title', '| IDs: TRAIN-0000-0001 TRAIN-0000-0002', '|     first line', '|     second line',
        '|     Finding: f1', '|     State: Unconfirmed', '|     Risk: Default login High', `|_    ${answer.findings[0].summary}`
    ]);
    assert.ok(lines.includes('|     State: Fixed'));
});

test('findings out of alias order print in alias order', () => {
    const v = load('alias_out_of_order');
    const answer = checkAnswer(v, 'print01', 'web');
    const aliases = gen.result(checkOffer('print01', 'web'), answer, v).map(l => l.map(s => s.text).join('')).filter(t => t.startsWith('|     Finding: ')).map(t => t.slice(14));
    assert.deepEqual(aliases, [...aliases].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))));
    assert.ok(aliases.length > 1);
});

test('an empty check prints the note; a refusal and a null answer print no table', () => {
    const v = load('swept_hosts');
    const empty = gen.result(checkOffer('print01', 'web'), checkAnswer(v, 'print01', 'web'), v);
    assert.ok(empty.some(l => l.length === 1 && l[0].text === texts.NO_FINDINGS_TEXT && l[0].cls === 'note'));
    assert.deepEqual(gen.result(scanOffer('print01'), { success: false, reason: 'not_responding' }, v), [[{ text: model.REFUSAL_TEXT.not_responding, cls: 'bad' }]]);
    assert.deepEqual(gen.result(scanOffer('print01'), null, v), [[{ text: texts.REQUEST_FAILED_TEXT, cls: 'bad' }]]);
});

test('the module is pure and safe', () => {
    const src = readFileSync(join(nv, 'cli-gen/scanner-output.js'), 'utf8');
    assert.deepEqual([...src.matchAll(/^import[\s\S]*?from '([^']+)'/gm)].map(m => m[1]).sort(), ['../ops-model.js', '../view-texts.js', './defaults.js']);
    for (const bad of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document', 'window', 'localStorage', 'Date', 'Math.random', 'eval', 'new Function', 'setTimeout', 'setInterval']) {
        assert.ok(!src.includes(bad), bad);
    }
    assert.equal(gen.id, 'scanner');
    assert.ok(Object.isFrozen(gen.TEMPLATES));
});

// One span per cell (Ops follow-up B3)
test('scanner tables: one span per cell, a width on every cell but the last, no padding spaces', () => {
    const v = load('swept_hosts');
    const lines = gen.result(scanOffer('print01'), scanAnswer(v, 'print01'), v);
    const rows = lines.filter(l => l.some(s => s.w !== undefined));
    assert.ok(rows.length >= 2, 'a head and a row');
    const head = rows[0];
    for (const r of rows) {
        const cells = r.filter(s => s.w !== undefined);
        assert.equal(cells.length, r.length - 1, 'the last cell has no width');
        cells.forEach((s, i) => {
            assert.equal(s.w, head[i].w, 'the width of a column is the same on every line');
            assert.ok(Number.isInteger(s.w) && s.w >= 1 && s.w <= 80);
            assert.ok(s.text.endsWith(' ') && !/ {2}/.test(s.text), JSON.stringify(s.text));
            assert.equal(s.w, Math.max(...rows.map(x => x[i].text.trimEnd().length)) + 2);
        });
        assert.ok(!/ {2}/.test(r.map(s => s.text).join('')), 'no run of spaces');
    }
    assert.equal(head[0].cls, 'head');
});

test('scanner tables: a control character in a cell is replaced by the log, not kept', () => {
    const v = load('swept_hosts');
    const lines = gen.result(scanOffer('print01'), scanAnswer(v, 'print01'), v);
    assert.ok(lines.every(l => l.every(s => typeof s.text === 'string')));
});
