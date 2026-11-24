// The S8c answer-shape fixture checked against itself (unit 02).
// Run with: node test/js/lock-step-answers.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAnswer, answerNames } from './helpers/lock-step-answers.mjs';

const REQUIRED = [
    'gate_push', 'gate_number', 'gate_code', 'gate_door_npc', 'open_object', 'open_door', 'first_factor_wrong',
    'verify_passed', 'verify_wrong', 'verify_stale_used', 'verify_stale_expired', 'verify_dropped', 'verify_closed',
    'prompt_waiting', 'prompt_passed', 'prompt_too_soon', 'prompt_expired', 'approve_passed', 'approve_cancelled',
    'phone_one_request', 'phone_number_request', 'not_found', 'no_phone', 'no_device', 'generic_refusal'
];
const STATUS = {
    gate_push: 200, gate_number: 200, gate_code: 200, gate_door_npc: 200, open_object: 200, open_door: 200,
    first_factor_wrong: 422, verify_passed: 200, verify_wrong: 422, verify_stale_used: 422,
    verify_stale_expired: 422, verify_dropped: 422, verify_closed: 422, prompt_waiting: 200, prompt_passed: 200,
    prompt_too_soon: 422, prompt_expired: 422, approve_passed: 200, approve_cancelled: 422,
    phone_one_request: 200, phone_number_request: 200, not_found: 404, no_phone: 403, no_device: 403,
    generic_refusal: 422
};
const FORBIDDEN = ['contents', 'roomData', 'requires', 'code', 'password', 'pin', 'right'];
const LEAKY = n => /^(gate_|verify_|prompt_|approve_|phone_)/.test(n);

function keysDeep(v, out = new Set()) {
    if (Array.isArray(v)) v.forEach(x => keysDeep(x, out));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { out.add(k); keysDeep(x, out); }
    return out;
}

test('every name of section 4.3 is present, with route, status and body', () => {
    for (const n of REQUIRED) {
        assert.ok(answerNames.includes(n), `missing ${n}`);
        const a = loadAnswer(n);
        assert.equal(typeof a.route, 'string', n);
        assert.equal(typeof a.body, 'object', n);
        assert.ok(Array.isArray(a.varies), `${n} varies`);
        for (const v of a.varies) assert.notEqual(v.split('.').reduce((o, k) => (o == null ? o : o[k]), a.body), undefined, `${n} varies names a missing key ${v}`);
    }
    assert.deepEqual([...answerNames].sort(), [...REQUIRED].sort());
});

test('statuses are those of section 4.3', () => {
    for (const [n, s] of Object.entries(STATUS)) assert.equal(loadAnswer(n).status, s, n);
});

test('no gate, verify, prompt, approve or phone body holds a forbidden key', () => {
    for (const n of answerNames.filter(LEAKY)) {
        const keys = keysDeep(loadAnswer(n).body);
        for (const k of FORBIDDEN) assert.ok(!keys.has(k), `${n} holds ${k}`);
    }
});

test('numbers only under the two phone entries; number only in the number gate', () => {
    for (const n of answerNames) {
        const keys = keysDeep(loadAnswer(n).body);
        assert.equal(keys.has('numbers'), n === 'phone_number_request', `numbers in ${n}`);
        assert.equal(keys.has('number'), n === 'gate_number', `number in ${n}`);
    }
    const num = loadAnswer('gate_number').body.number;
    assert.match(String(num), /^\d{2}$/);
    assert.ok(loadAnswer('phone_number_request').body.requests[0].numbers.includes(num));
});

test('a lock has no lockout counter, and a pass carries no contents or roomData', () => {
    for (const n of answerNames) assert.ok(!keysDeep(loadAnswer(n).body).has('attemptsLeft'), n);
    assert.equal(loadAnswer('gate_door_npc').body.opener, 'moira');
    assert.ok(!('opener' in loadAnswer('gate_push').body));
});

test('contents and roomData appear only in the two open answers', () => {
    for (const n of answerNames) {
        const keys = keysDeep(loadAnswer(n).body);
        assert.equal(keys.has('contents'), n === 'open_object', n);
        assert.equal(keys.has('roomData'), n === 'open_door', n);
    }
    for (const n of ['open_object', 'open_door', 'first_factor_wrong']) assert.ok(loadAnswer(n).from, `${n} names its source`);
});

test('loadAnswer hands out a copy and refuses an unknown name', () => {
    const a = loadAnswer('gate_push'); a.body.kind = 'x';
    assert.equal(loadAnswer('gate_push').body.kind, 'push');
    assert.throws(() => loadAnswer('nope'));
});
