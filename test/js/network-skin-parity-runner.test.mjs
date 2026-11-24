// The live parity runner's own checks (Ops S6 unit 25): its answer normaliser and its request comparison.
// The live run itself is the tester's. Run with: bin/test-js test/js/network-skin-parity-runner.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const run = await import(pathToFileURL(join(here, '../../tools/playtest/network-skin-parity.mjs')));
const { STEPS, startSkinProblem, REMOVED_KEYS, OPS_FIELDS, normaliseAnswer, checkRemovedList, compareRequests, requestRecord, isRecorded, stripGameId } = run;

test('the removed keys are one list, each with a reason, and none is an ops field', () => {
    assert.ok(REMOVED_KEYS.length > 0);
    for (const e of REMOVED_KEYS) { assert.equal(typeof e.key, 'string'); assert.ok(e.reason.trim().length > 10, e.key); }
    assert.equal(checkRemovedList(REMOVED_KEYS), true);
    for (const f of ['alias', 'already', 'finding', 'need', 'reason', 'status', 'cli', 'findings', 'falseBecause', 'needs', 'fixed', 'hostId', 'service', 'class', 'severity', 'summary', 'address', 'services', 'session', 'credential']) assert.ok(OPS_FIELDS.includes(f), f);
    for (const f of OPS_FIELDS) assert.ok(!REMOVED_KEYS.some(e => e.key === f), f);
});

test('normaliseAnswer removes only the listed keys, at every depth', () => {
    const answer = { ok: true, gameId: 4, finding: { id: 'x', alias: 'f1', status: 'confirmed', at: 9, need: ['n'] }, rows: [{ at: 1, reason: 'r', already: false, keep: 1 }] };
    const out = normaliseAnswer(answer);
    assert.deepEqual(out, { ok: true, finding: { id: 'x', alias: 'f1', status: 'confirmed', need: ['n'] }, rows: [{ reason: 'r', already: false, keep: 1 }] });
    assert.ok('gameId' in answer && 'at' in answer.finding, 'the input is not changed');
    const custom = [{ key: 'keep', reason: 'a test key' }];
    assert.deepEqual(normaliseAnswer({ keep: 1, at: 2 }, custom), { at: 2 });
    assert.equal(normaliseAnswer(undefined), null);
    assert.equal(normaliseAnswer('text'), 'text');
});

test('normaliseAnswer refuses a list that names an ops field, repeats a key or gives no reason', () => {
    for (const f of OPS_FIELDS) assert.throws(() => normaliseAnswer({ [f]: 1 }, [{ key: f, reason: 'because' }]), /ops field/, f);
    assert.throws(() => normaliseAnswer({}, [{ key: 'a', reason: 'x' }, { key: 'a', reason: 'y' }]), /twice/);
    assert.throws(() => normaliseAnswer({}, [{ key: 'a', reason: '  ' }]), /reason/);
    assert.throws(() => normaliseAnswer({}, [{ reason: 'no key' }]), /reason/);
    assert.throws(() => normaliseAnswer({}, 'at'), /array/);
});

test('only POSTs to /network/*, the sign-in route and the share route are recorded; the game id is removed', () => {
    assert.equal(stripGameId('/break_escape/games/17/network/scan'), '/network/scan');
    assert.equal(isRecorded('POST', '/network/scan'), true);
    assert.equal(isRecorded('POST', '/login'), true);
    assert.equal(isRecorded('POST', '/share'), true);
    assert.equal(isRecorded('GET', '/network'), false);
    assert.equal(isRecorded('POST', '/sync_state'), false);
    assert.equal(isRecorded('PUT', '/network/scan'), false);
});

const log = (body) => [requestRecord('post', '/break_escape/games/1/network/scan', body), requestRecord('POST', '/break_escape/games/1/network/check', '{"a":1}')];

test('the request comparison passes equal lists and fails on a one-byte difference', () => {
    const a = log('{"hostId":"files01"}');
    const same = log('{"hostId":"files01"}').map(r => ({ ...r, path: r.path }));
    assert.deepEqual(compareRequests({ A: a, B: same, C: log('{"hostId":"files01"}') }), []);
    const oneByte = compareRequests({ A: a, B: log('{"hostId":"files02"}'), C: a });
    assert.equal(oneByte.length, 1);
    assert.equal(oneByte[0].index, 0);
    assert.match(oneByte[0].games, /A \/ B/);
    assert.equal(compareRequests({ A: a, B: a, C: log('{"hostId":"files01"} ') }).length, 1, 'a trailing space differs');
    assert.equal(compareRequests({ A: a, B: a.map(r => ({ ...r, method: 'PUT' })), C: a }).length, 2, 'the method differs');
});

test('a missing or extra request fails the comparison', () => {
    const a = log('x');
    assert.equal(compareRequests({ A: a, B: a.slice(0, 1), C: a }).length, 1);
    assert.equal(compareRequests({ A: a, B: [...a, a[0]], C: a }).length, 1);
});

test('the Terminal game types the sweep, and the first step is the sweep', () => {
    assert.equal(STEPS[0].find.action, 'sweep');
    assert.equal(STEPS[0].B, 'typed');
    assert.equal(STEPS[0].A, 'button');
});

test('a game must start in its own skin and have the switch', () => {
    assert.equal(startSkinProblem({ skin: 'cli', hasSwitch: true }, 'cli'), null);
    assert.equal(startSkinProblem({ skin: 'gui', hasSwitch: true }, 'gui'), null);
    assert.match(startSkinProblem({ skin: 'gui', hasSwitch: true }, 'cli'), /gui, not cli/);
    assert.match(startSkinProblem({ skin: 'cli', hasSwitch: false }, 'cli'), /no skin switch/);
    assert.match(startSkinProblem({ skin: null, hasSwitch: false }, 'cli'), /no skin/);
    assert.match(startSkinProblem(null, 'gui'), /no skin/);
});
