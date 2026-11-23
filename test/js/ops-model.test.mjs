// ops-model.js (ops core plan 5.5, 11.3): the shared pure module. S1: the refusal table, the
// pending key, scan and sweep merging, the plain facts about a block or a row. It imports
// nothing and touches no DOM: the module is loaded here with no window or document at all.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, '../../public/break_escape/js/minigames/network-view/ops-model.js');
const M = await import(pathToFileURL(file));

test('the module imports nothing and names no DOM', () => {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /^\s*import\s/m);
    assert.doesNotMatch(text, /\bdocument\.|\bwindow\.|innerHTML/);
});

test('REFUSAL_TEXT has a line for every code in ops_refusal_codes.json, and no code is left without words', () => {
    const codes = JSON.parse(readFileSync(join(here, '../fixtures/files/ops_refusal_codes.json'), 'utf8'));
    assert.ok(codes.length >= 17);
    for (const c of codes) {
        assert.equal(typeof M.REFUSAL_TEXT[c], 'string', c);
        assert.ok(M.REFUSAL_TEXT[c].length > 0, c);
        assert.equal(M.refusalText(c), M.REFUSAL_TEXT[c]);
    }
    assert.ok(Object.isFrozen(M.REFUSAL_TEXT));
});

test('an unknown code, a non-string and an inherited name map to the neutral line', () => {
    for (const c of ['made_up', undefined, null, 7, 'toString', '__proto__', '']) assert.equal(M.refusalText(c), M.UNKNOWN_REFUSAL_TEXT);
    assert.equal(M.refusalText('no_answer'), M.REFUSAL_TEXT.no_answer);
});

test('pendingKey builds one key per action and target, and use takes the card and finding together', () => {
    assert.equal(M.pendingKey('sweep', 'lab'), 'sweep:lab');
    assert.notEqual(M.pendingKey('sweep', 'x'), M.pendingKey('scan', 'x'));
    assert.equal(M.pendingKey('use', { card: 'c1', finding: 'f1' }), 'use:c1|f1');
    assert.notEqual(M.pendingKey('use', { card: 'c2', finding: 'f1' }), M.pendingKey('use', { card: 'c1', finding: 'f1' }));
    assert.notEqual(M.pendingKey('use', { card: 'c1', finding: 'f2' }), M.pendingKey('use', { card: 'c1', finding: 'f1' }));
});

test('what a block and a row offer', () => {
    assert.equal(M.offersSweep({ swept: false }), true);
    assert.equal(M.offersSweep({ swept: true, ops: true }), false);
    assert.equal(M.offersSweep({}), false, 'no discovery: no Sweep');
    assert.equal(M.offersSweep({ swept: false, route: 'down' }), false);
    assert.equal(M.isOpsBlock({ id: 'a', hosts: [] }), false);
    assert.equal(M.isOpsBlock({ swept: false }), true);
    const ops = { ops: true };
    assert.equal(M.offersScan({ kind: 'device' }, ops), true);
    assert.equal(M.offersScan({ kind: 'pc' }, ops), true);
    assert.equal(M.offersScan({ kind: 'pc', scanned: true }, ops), false);
    assert.equal(M.offersScan({ kind: 'pc', responding: false }, ops), false);
    assert.equal(M.offersScan({ kind: 'file_share' }, ops), false);
    assert.equal(M.offersScan({ kind: 'pc' }, { swept: false }), false, 'Scan only inside a block marked ops');
    assert.equal(M.offersScan({ kind: 'pc' }, null), false);
});

test('serviceLine and rowServices', () => {
    assert.equal(M.serviceLine({ name: 'files', label: 'files', port: 445, product: 'Brackley ShareServe', version: '3.1' }),
        'files · 445 · Brackley ShareServe 3.1');
    assert.equal(M.serviceLine({ name: 'x', port: 22 }), 'x · 22');
    assert.deepEqual(M.rowServices({ scanned: false, services: [{ name: 'a' }] }), []);
    assert.deepEqual(M.rowServices({ scanned: true, services: [{ name: 'a', port: 1 }, null, { port: 2 }] }),
        [{ name: 'a', label: 'a', port: 1, product: '', version: '' }]);
});

test('mergeRow replaces by id or appends, without changing its input', () => {
    const rows = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
    const out = M.mergeRow(rows, { id: 'b', scanned: true });
    assert.deepEqual(out, [{ id: 'a', name: 'A' }, { id: 'b', name: 'B', scanned: true }]);
    assert.deepEqual(rows[1], { id: 'b', name: 'B' });
    assert.equal(M.mergeRow(rows, { id: 'c' }).length, 3);
    assert.equal(M.mergeRow(rows, { name: 'no id' }), rows);
});

const VIEW = { id: 'jack', network: { id: 'lab' }, hosts: [],
    networks: [{ id: 'lab', route: 'up', swept: false, hosts: [] }, { id: 'far', route: 'up', ops: true, hosts: [{ id: 'h1', kind: 'pc' }] }] };

test('applyScanAnswer: a sweep sets swept and the rows on the block and the own flat list, and leaves the input alone', () => {
    const before = JSON.stringify(VIEW);
    const out = M.applyScanAnswer(VIEW, { action: 'sweep', target: 'lab' },
        { success: true, network: { id: 'lab', swept: true, hosts: [{ id: 'p1', kind: 'device', name: 'Printer' }] } });
    assert.equal(JSON.stringify(VIEW), before);
    assert.deepEqual(out.hosts.map(r => r.id), ['p1']);
    assert.equal(out.networks[0].swept, true);
    assert.deepEqual(out.networks[0].hosts.map(r => r.id), ['p1']);
    assert.equal(out.networks[1], VIEW.networks[1], 'another block is untouched');
});

test('applyScanAnswer: a host scan merges the row into every list that holds it', () => {
    const out = M.applyScanAnswer(VIEW, { action: 'scan', target: 'h1' },
        { success: true, host: { id: 'h1', kind: 'pc', scanned: true, services: [{ name: 's', port: 1 }] } });
    assert.equal(out.networks[1].hosts[0].scanned, true);
    assert.deepEqual(out.hosts, []);
});

test('applyScanAnswer: a refusal, a null answer and an answer it cannot place return the view as it was', () => {
    for (const a of [null, { success: false, reason: 'not_found' }, { success: true }]) {
        assert.equal(M.applyScanAnswer(VIEW, { action: 'scan', target: 'h1' }, a), VIEW);
    }
    assert.equal(M.applyScanAnswer(VIEW, { action: 'check', target: 'x' }, { success: true, host: { id: 'h1' } }), VIEW);
});

// S2: findings helpers
const FF = (n, over = {}) => ({ id: `h.s.w${n}`, alias: `f${n}`, hostId: 'h', service: 's', class: 'unpatched', severity: 'low', summary: '', status: 'unconfirmed', ...over });
const FVIEW = () => ({ hosts: [{ id: 'h', kind: 'device', scanned: true, services: [{ name: 's' }] }],
    networks: [{ id: 'n', route: 'up', ops: true, hosts: [{ id: 'h', kind: 'device', scanned: true, services: [{ name: 's' }] }] }] });

test('findings: sort by alias number, words, class default line', () => {
    assert.deepEqual(M.sortFindings([FF(10), FF(2), FF(1)]).map(f => f.alias), ['f1', 'f2', 'f10']);
    assert.deepEqual(M.sortFindings([{ id: 'z', alias: 'x' }, FF(3)]).map(f => f.alias), ['f3', 'x']);
    assert.equal(M.classWord('default_creds'), 'Default login');
    assert.equal(M.classWord('odd'), 'odd');
    assert.equal(M.severityWord('high'), 'High');
    for (const c of ['default_creds', 'unpatched', 'misconfig', 'weak_auth', 'cleartext']) {
        assert.ok(M.CLASS_WORDS[c] && M.CLASS_DEFAULT_LINE[c], c);
        assert.equal(M.findingSummary({ class: c, summary: '' }), M.CLASS_DEFAULT_LINE[c]);
    }
    assert.equal(M.findingSummary({ class: 'unpatched', summary: 'Mine.' }), 'Mine.');
    assert.equal(M.findingSummary({ class: 'odd' }), '');
});

test('findings: needs, Fixed, false reason and the offers', () => {
    assert.equal(M.needLine({ label: 'A manual', met: false }), 'A manual: no');
    assert.equal(M.needLine({ label: 'A manual', met: true }), 'A manual: yes');
    assert.deepEqual(M.findingNeeds({ status: 'unconfirmed', needs: [{ label: 'x', met: true }] }), []);
    assert.deepEqual(M.findingNeeds({ status: 'confirmed', needs: [{ kind: 'item', label: 'x', met: true }] }), [{ kind: 'item', label: 'x', met: true }]);
    assert.equal(M.isFixed({ status: 'confirmed', fixed: true }), true);
    assert.equal(M.isFixed({ status: 'unconfirmed', fixed: true }), false);
    assert.equal(M.isFixed({ status: 'false', fixed: true }), false);
    assert.equal(M.falseReason({ status: 'false', falseBecause: 'Because.' }), 'Because.');
    assert.equal(M.falseReason({ status: 'confirmed', falseBecause: 'Because.' }), '');
    const row = { id: 'h', kind: 'device', scanned: true };
    assert.equal(M.offersCheck(row), true);
    assert.equal(M.offersCheck({ ...row, scanned: false }), false);
    assert.equal(M.offersCheck({ ...row, responding: false }), false);
    assert.equal(M.offersConfirm(row, FF(1)), true);
    assert.equal(M.offersConfirm(row, FF(1, { status: 'confirmed' })), false);
    assert.equal(M.offersConfirm({ ...row, responding: false }, FF(1)), false);
});

test('findings: check target, alias lookup', () => {
    assert.equal(M.checkTarget('h', 's'), 'h:s');
    assert.deepEqual(M.parseCheckTarget('h:s'), { hostId: 'h', service: 's' });
    assert.equal(M.parseCheckTarget('hs'), null);
    assert.equal(M.pendingKey('check', 'h:s'), 'check:h:s');
    const v = FVIEW();
    v.hosts[0].findings = [FF(1)];
    assert.equal(M.findingIdByAlias(v, 'f1'), 'h.s.w1');
    assert.equal(M.findingIdByAlias(v, 'f9'), null);
    assert.equal(M.findFinding(v, 'h.s.w1').row.id, 'h');
});

test('findings: a check answer merges by id into every list holding the host, never changes its input, keeps settled fields', () => {
    const v = FVIEW();
    const frozen = JSON.stringify(v);
    const out = M.applyOpsAnswer(v, { action: 'check', target: 'h:s' }, { success: true, hostId: 'h', service: 's', findings: [FF(1), FF(2)] });
    assert.equal(JSON.stringify(v), frozen);
    assert.equal(out.hosts[0].findings.length, 2);
    assert.equal(out.networks[0].hosts[0].findings.length, 2);
    const conf = FF(1, { status: 'confirmed', needs: [{ kind: 'item', label: 'x', met: false }] });
    const out2 = M.applyOpsAnswer(out, { action: 'confirm', target: 'h.s.w1' }, { success: true, finding: conf });
    assert.equal(out2.hosts[0].findings[0].status, 'confirmed');
    assert.equal(out2.hosts[0].findings[0].needs.length, 1);
    assert.equal(out2.hosts[0].findings[1].alias, 'f2');
    assert.equal(out2.networks[0].hosts[0].findings[0].status, 'confirmed');
    // an empty answer, a refusal and a stranger change nothing
    assert.equal(M.applyCheckAnswer(v, { success: true, hostId: 'h', findings: [] }), v);
    assert.equal(M.applyCheckAnswer(v, { success: false, reason: 'x' }), v);
    assert.equal(M.applyConfirmAnswer(v, { success: true, finding: { id: 'a', hostId: 'nobody' } }).hosts[0].findings, undefined);
    // scan and sweep still route through
    assert.equal(M.applyOpsAnswer(v, { action: 'scan' }, null), v);
});
