// scripts/validate_capture_log.rb, K3d (plan 8.7): the authored rowTag and rowSource on a capture
// writer, and the ambiguous capture address warning. The server reads the same fields in
// CaptureModel.capture_row_meta. Run with: node test/js/validator-row-tags.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function issues(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_capture_log.rb'))}
      puts JSON.generate(check_capture_log(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const errors = list => list.filter(s => s.startsWith('❌'));
const warnings = list => list.filter(s => s.startsWith('⚠️'));
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);
const assertNot = (list, frag) => assert.ok(!has(list, frag), `did not expect "${frag}" in:\n${list.join('\n')}`);

const cap = (targetId, extra = {}) => ({ targetId, ...extra });
function base(npcs = []) {
    return {
        startRoom: 'office',
        social: { captures: { revealSecret: true } },
        rooms: { office: { type: 'room_office', connections: {}, objects: [], npcs } }
    };
}
const holder = (id, username, mappings = []) => ({
    id, npcType: 'person', creds: { username, password: `${id}-Pass-401` }, eventMappings: mappings
});
const hax = (mappings, extra = {}) => ({ id: 'hax', npcType: 'phone', eventMappings: mappings, ...extra });
const mapping = (capture) => ({ eventPattern: 'x', addCapture: capture });
function action(sc, capture) {
    sc.timers = [{ id: 't1', afterMs: 5, actions: [{ type: 'add_capture', capture }] }];
    return sc;
}

test('a clean scenario with valid rowTag and rowSource raises nothing for them', { skip }, () => {
    const sc = base([hax([
        mapping(cap('a', { kind: 'credential', secret: '4821', rowTag: 'pin' })),
        mapping(cap('b', { kind: 'credential', secret: 'pw', rowTag: 'password', rowSource: 'phished' })),
        mapping(cap('c', { kind: 'foothold', host: 'h', rowTag: 'finding' })),
        mapping(cap('d', { kind: 'foothold', host: 'h', rowTag: 'foothold' }))
    ])]);
    const out = issues(sc);
    assertNot(out, 'rowTag');
    assertNot(out, 'rowSource');
});

test('a rowTag outside the four values is an error', { skip }, () => {
    const sc = base([hax([mapping(cap('a', { kind: 'credential', secret: 'x', rowTag: 'token' }))])]);
    assertHas(errors(issues(sc)), 'rowTag "token"');
});

test('foothold and finding on a credential capture are errors', { skip }, () => {
    for (const tag of ['foothold', 'finding']) {
        const sc = base([hax([mapping(cap('a', { kind: 'credential', secret: 'x', rowTag: tag }))])]);
        assertHas(errors(issues(sc)), `rowTag "${tag}" on a credential capture`);
    }
});

test('pin and password on a foothold capture are errors', { skip }, () => {
    for (const tag of ['pin', 'password']) {
        const sc = base([hax([mapping(cap('a', { kind: 'foothold', host: 'h', rowTag: tag }))])]);
        assertHas(errors(issues(sc)), `rowTag "${tag}" on a foothold capture`);
    }
});

test('a non-string rowTag is an error', { skip }, () => {
    const sc = base([hax([mapping(cap('a', { kind: 'credential', secret: 'x', rowTag: ['pin'] }))])]);
    assertHas(errors(issues(sc)), 'rowTag');
});

test('rowSource: only "phished" is allowed, and never on a foothold capture', { skip }, () => {
    let sc = base([hax([mapping(cap('a', { kind: 'credential', secret: 'x', rowSource: 'recorded' }))])]);
    assertHas(errors(issues(sc)), 'rowSource "recorded"');
    sc = base([hax([mapping(cap('a', { kind: 'credential', secret: 'x', rowSource: 7 }))])]);
    assertHas(errors(issues(sc)), 'rowSource');
    sc = base([hax([mapping(cap('a', { kind: 'foothold', host: 'h', rowSource: 'phished' }))])]);
    assertHas(errors(issues(sc)), 'rowSource on a foothold capture');
});

test('the same rules apply to an add_capture action and an NPC usePayload', { skip }, () => {
    let sc = action(base([hax([])]), cap('a', { kind: 'credential', secret: 'x', rowTag: 'finding' }));
    assertHas(errors(issues(sc)), 'rowTag "finding" on a credential capture');
    sc = base([hax([], { usePayload: cap('p', { kind: 'foothold', host: 'h', rowSource: 'phished' }) })]);
    assertHas(errors(issues(sc)), 'rowSource on a foothold capture');
});

test('one bad mapping on an NPC with a usePayload is reported once', { skip }, () => {
    const sc = base([hax([mapping(cap('a', { kind: 'credential', secret: 'x', rowTag: 'token' }))],
        { usePayload: { host: 'h' } })]);
    const hits = errors(issues(sc)).filter(s => s.includes('rowTag "token"'));
    assert.equal(hits.length, 1, hits.join('\n'));
});

test('a capture address naming two account holders is a warning', { skip }, () => {
    const sc = base([
        holder('amy', 'a.b'), holder('amy2', ' A.B '),
        hax([mapping(cap('a', { kind: 'credential', address: 'a.b', secret: 'x' }))])
    ]);
    assertHas(warnings(issues(sc)), 'ambiguous capture address');
});

test('an address naming one holder, or none, raises no ambiguity warning', { skip }, () => {
    const sc = base([
        holder('amy', 'a.b'), holder('bo', 'b.c'),
        hax([mapping(cap('a', { kind: 'credential', address: 'a.b', secret: 'x' })),
             mapping(cap('b', { kind: 'credential', address: 'web.user', secret: 'y' }))])
    ]);
    assertNot(warnings(issues(sc)), 'ambiguous capture address');
});
