// Blockchain explorer, "match across the mixer" mode: the matching rules
// (mixer-match-model.js) on a fixture case shaped like m06's.
// Run with: node --test test/js/blockchain-mixer-match.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const M = await import(dataUrl(readFileSync(join(js, 'minigames/blockchain-explorer/mixer-match-model.js'), 'utf8')));

const mixer = { name: 'pool', feePercent: 1.5, minHoldHours: 6 };
const deposits = [
    { id: 'a', wallet: 'wA', amount: 2400000, time: '2025-07-14T21:40Z', required: true, change: { wallet: 'wA2', amount: 37250 } },
    { id: 'b', wallet: 'wB', amount: 1200000, time: '2025-07-29T22:10Z', required: true },
    { id: 'c', wallet: 'wC', amount: 680000, time: '2025-08-03T20:05Z', required: true }
];
const W = (id, slot, amount, time) => ({ id, slot, amount, time });
const withdrawals = [
    W('early', '3815', 2364000, '2025-07-15T01:15Z'),
    W('a_ok', '4471', 2364000, '2025-07-15T04:20Z'),
    W('a_bad', '5093', 2346000, '2025-07-15T05:10Z'),
    W('nofee', '6120', 1200000, '2025-07-30T02:40Z'),
    W('b_ok', '4471', 1182000, '2025-07-30T05:05Z'),
    W('c_early', '2207', 669800, '2025-08-04T01:50Z'),
    W('c_ok', '4471', 669800, '2025-08-04T03:35Z'),
    W('change', '8846', M.expectedPayout(2437250, 1.5), '2025-07-15T09:00Z'),
    W('before', '2207', 310400, '2025-07-14T20:00Z')
];
const byId = Object.fromEntries(withdrawals.map(w => [w.id, w]));
const codes = (d, w) => M.evaluateLink(d, w, mixer).problems.map(p => p.code);

test('amount less fee and the hold', () => {
    assert.equal(M.expectedPayout(2400000, 1.5), 2364000);
    const r = M.evaluateLink(deposits[0], byId.a_ok, mixer);
    assert.equal(r.ok, true);
    assert.equal(r.hold, 400);
    assert.equal(M.formatHold(r.hold), '+6 h 40 m');
    assert.equal(M.payoutPercent(deposits[0], byId.a_ok), 98.5);
});

test('each wrong link names the rule it breaks', () => {
    assert.deepEqual(codes(deposits[0], byId.early), ['too_early']);
    assert.deepEqual(codes(deposits[0], byId.a_bad), ['wrong_amount']);
    assert.deepEqual(codes(deposits[1], byId.nofee), ['too_early', 'no_fee']);
    assert.deepEqual(codes(deposits[0], byId.change), ['change_included']);
    assert.deepEqual(codes(deposits[0], byId.before), ['before_deposit', 'wrong_amount']);
    assert.deepEqual(codes(deposits[2], byId.c_early), ['too_early']);
});

test('an optional maximum hold closes the window', () => {
    const r = M.evaluateLink(deposits[0], byId.a_ok, { ...mixer, maxHoldHours: 6.5 });
    assert.deepEqual(r.problems.map(p => p.code), ['too_late']);
});

test('the case has one answer and one reused slot', () => {
    assert.deepEqual(M.checkCase({ deposits, withdrawals, mixer }), []);
    const matches = { a: byId.a_ok, b: byId.b_ok };
    assert.equal(M.reusedSlot(deposits, matches), null, 'not all matched yet');
    matches.c = byId.c_ok;
    assert.equal(M.reusedSlot(deposits, matches), '4471');
});

test('checkCase reports an ambiguous or split case', () => {
    const dup = [...withdrawals, W('dup', '9999', 2364000, '2025-07-15T06:00Z')];
    assert.match(M.checkCase({ deposits, withdrawals: dup, mixer }).join(), /deposit a: 2 withdrawals/);
    const split = withdrawals.map(w => (w.id === 'c_ok' ? { ...w, slot: '1111' } : w));
    assert.match(M.checkCase({ deposits, withdrawals: split, mixer }).join(), /one slot/);
});

test('feedback text is plain and specific', () => {
    const ctx = (d, w) => ({ deposit: d, withdrawal: w, mixer, result: M.evaluateLink(d, w, mixer), money: n => `$${n}` });
    assert.match(M.problemText('too_early', ctx(deposits[0], byId.early)), /3 h 35 m after the deposit.*at least 6 hours/);
    assert.match(M.problemText('no_fee', ctx(deposits[1], byId.nofee)), /no fee taken.*1\.5%/);
});

test('the explorer routes mode "mixer_match" to the board and leaves the graph mode alone', () => {
    const src = readFileSync(join(js, 'minigames/blockchain-explorer/blockchain-explorer-minigame.js'), 'utf8');
    assert.match(src, /md\.mode === 'mixer_match' \? new MixerMatchBoard/);
    assert.match(src, /if \(this\._mixerBoard\) return this\._mixerBoard\.render\(\)/);
    const board = readFileSync(join(js, 'minigames/blockchain-explorer/mixer-match-board.js'), 'utf8');
    assert.match(board, /this\.scene\.complete\(true\)/, 'closing is a normal exit');
    assert.doesNotMatch(board, /complete\(false\)/);
});
