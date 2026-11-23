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
