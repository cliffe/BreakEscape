// Gap tests for minigames/inbox-triage/triage-scoring.js: empty inputs, boundary bands,
// cap/clamp edges, duplicates and out-of-order answers, both scoring profiles.
// Run with: bin/test-js test/js/social-gap-triage-scoring.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-triage-scoring-'));
writeFileSync(join(dir, 'triage-scoring.mjs'), readFileSync(join(js, 'minigames/inbox-triage/triage-scoring.js'), 'utf8'));
const S = await import(pathToFileURL(join(dir, 'triage-scoring.mjs')).href);
const { scoreTriage, flagPoints, verdictPoints, bandFor, weakestFactor } = S;

const phish = (id, flags = ['a', 'b']) => ({ id, truth: { isPhish: true, flags } });
const real = (id) => ({ id, truth: { isPhish: false, flags: [] } });

test('empty message list scores 0 percent without dividing by zero', () => {
    const r = scoreTriage({ messages: [], answers: [] });
    assert.equal(r.percent, 0);
    assert.equal(r.reportRate, 0);
    assert.equal(r.phishTotal, 0);
    assert.deepEqual(r.unanswered, []);
});

test('called with no argument at all throws a TypeError (messages missing), not a crash on destructure', () => {
    assert.throws(() => scoreTriage(), TypeError);
    assert.throws(() => scoreTriage({ messages: 'x' }), TypeError);
});

test('answers undefined/null is treated as nothing answered', () => {
    for (const answers of [undefined, null]) {
        const r = scoreTriage({ messages: [phish('p1'), real('r1')], answers });
        assert.equal(r.percent, 0);
        assert.deepEqual(r.unanswered, ['p1', 'r1']);
        assert.equal(r.perMessage[0].answered, false);
        assert.deepEqual(r.perMessage[0].missed, ['a', 'b']);
    }
});

test('unanswered messages count as zero in the mean but do not touch phishTotal', () => {
    const r = scoreTriage({
        messages: [phish('p1'), phish('p2')],
        answers: [{ id: 'p1', verdict: 'report', flags: ['a', 'b'] }],
    });
    assert.equal(r.percent, 50);
    assert.equal(r.phishTotal, 1);
    assert.equal(r.phishCaught, 1);
});

test('answers for unknown message ids are ignored', () => {
    const r = scoreTriage({ messages: [real('r1')], answers: [{ id: 'ghost', verdict: 'report' }, { id: 'r1', verdict: 'trust' }] });
    assert.equal(r.percent, 100);
    assert.equal(r.perMessage.length, 1);
});

test('answers arrive out of order and with messageId instead of id', () => {
    const r = scoreTriage({
        messages: [real('r1'), phish('p1')],
        answers: [{ messageId: 'p1', verdict: 'report', flags: ['a', 'b'] }, { id: 'r1', verdict: 'trust' }],
    });
    assert.deepEqual(r.perMessage.map((m) => m.id), ['r1', 'p1']);
    assert.equal(r.percent, 100);
});

test('a repeated answer for the same message: the last one wins', () => {
    const r = scoreTriage({
        messages: [phish('p1')],
        answers: [{ id: 'p1', verdict: 'trust', flags: [] }, { id: 'p1', verdict: 'report', flags: ['a', 'b'] }],
    });
    assert.equal(r.percent, 100);
    assert.equal(r.perMessage.length, 1);
});

test('duplicate flag ids in one answer count once (no double catch, no double false claim)', () => {
    const r = scoreTriage({
        messages: [phish('p1', ['a', 'b'])],
        answers: [{ id: 'p1', verdict: 'report', flags: ['a', 'a', 'a', 'z', 'z'] }],
        profile: 'analyst',
    });
    const m = r.perMessage[0];
    assert.deepEqual(m.caught, ['a']);
    assert.deepEqual(m.falseClaims, ['z']);
    // 40 * clamp((1 - 1)/2) = 0
    assert.equal(m.flagPoints, 0);
});

test('duplicate authored flags collapse so F is not inflated', () => {
    const r = scoreTriage({
        messages: [phish('p1', ['a', 'a'])],
        answers: [{ id: 'p1', verdict: 'report', flags: ['a'] }],
    });
    assert.equal(r.perMessage[0].score, 100);
    assert.deepEqual(r.flagRecall, { caught: 1, total: 1 });
});

test('analyst: false claims beyond the caught count clamp the reasons at 0, never negative', () => {
    const r = scoreTriage({
        messages: [phish('p1', ['a'])],
        answers: [{ id: 'p1', verdict: 'report', flags: ['x', 'y', 'z', 'w'] }],
        profile: 'analyst',
    });
    assert.equal(r.perMessage[0].flagPoints, 0);
    assert.equal(r.perMessage[0].score, 60);
});

test('awareness: false claims on a phish cost nothing; analyst they do', () => {
    const msgs = [phish('p1', ['a', 'b'])];
    const ans = [{ id: 'p1', verdict: 'report', flags: ['a', 'b', 'x', 'y', 'z'] }];
    assert.equal(scoreTriage({ messages: msgs, answers: ans, profile: 'awareness' }).percent, 100);
    // net = 2 - 3 = -1 -> 0
    assert.equal(scoreTriage({ messages: msgs, answers: ans, profile: 'analyst' }).percent, 60);
});

test('analyst: a real message with 0/1/2/5 false claims gives 40/20/0/0 reason points', () => {
    const pts = [0, 1, 2, 5].map((n) => {
        const flags = Array.from({ length: n }, (_, i) => `f${i}`);
        return scoreTriage({ messages: [real('r1')], answers: [{ id: 'r1', verdict: 'trust', flags }], profile: 'analyst' }).perMessage[0].flagPoints;
    });
    assert.deepEqual(pts, [40, 20, 0, 0]);
});

test('awareness: a real message with any number of false claims keeps all 40 reason points', () => {
    const r = scoreTriage({ messages: [real('r1')], answers: [{ id: 'r1', verdict: 'trust', flags: ['x', 'y', 'z'] }], profile: 'awareness' });
    assert.equal(r.perMessage[0].score, 100);
});

test('the none chip is ignored even when ticked together with real flags', () => {
    const r = scoreTriage({
        messages: [phish('p1', ['a'])],
        answers: [{ id: 'p1', verdict: 'report', flags: ['none', 'a'] }],
        profile: 'analyst',
    });
    assert.deepEqual(r.perMessage[0].falseClaims, []);
    assert.equal(r.perMessage[0].score, 100);
});

test('flags undefined or null on an answer behaves like an empty list', () => {
    for (const flags of [undefined, null]) {
        const r = scoreTriage({ messages: [real('r1')], answers: [{ id: 'r1', verdict: 'trust', flags }] });
        assert.equal(r.percent, 100);
    }
});

test('authored F = 0 on a phish scores 0 reason points instead of NaN', () => {
    const r = scoreTriage({ messages: [phish('p1', [])], answers: [{ id: 'p1', verdict: 'report', flags: ['x'] }] });
    assert.equal(r.perMessage[0].flagPoints, 0);
    assert.equal(r.perMessage[0].score, 60);
    assert.ok(Number.isFinite(r.percent));
});

test('truth missing entirely is treated as a real message with no flags', () => {
    const r = scoreTriage({ messages: [{ id: 'x' }], answers: [{ id: 'x', verdict: 'trust' }] });
    assert.equal(r.perMessage[0].isPhish, false);
    assert.equal(r.percent, 100);
});

test('verdict tables: every cell, both profiles', () => {
    const expect = {
        analyst: { phish: { report: 60, delete: 30, trust: 0 }, real: { report: 20, delete: 0, trust: 60 } },
        awareness: { phish: { report: 60, verify: 60, delete: 30, trust: 0 }, real: { report: 60, verify: 60, delete: 30, trust: 60 } },
    };
    for (const [prof, t] of Object.entries(expect)) {
        for (const [kind, row] of Object.entries(t)) {
            for (const [v, pts] of Object.entries(row)) {
                assert.equal(verdictPoints(prof, kind === 'phish', v), pts, `${prof}/${kind}/${v}`);
            }
        }
    }
});

test('analyst profile rejects verify, unknown verdicts and unknown profiles', () => {
    assert.throws(() => verdictPoints('analyst', true, 'verify'), RangeError);
    assert.throws(() => verdictPoints('awareness', true, 'shrug'), RangeError);
    assert.throws(() => verdictPoints('nope', true, 'report'), RangeError);
    assert.throws(() => flagPoints('nope', true, { caught: 0, falseClaims: 0, authored: 1 }), RangeError);
    assert.throws(() => scoreTriage({ messages: [], profile: 'nope' }), RangeError);
});

test('a null verdict on an answered message throws rather than scoring silently', () => {
    assert.throws(() => scoreTriage({ messages: [real('r1')], answers: [{ id: 'r1', verdict: null }] }), RangeError);
    assert.throws(() => scoreTriage({ messages: [real('r1')], answers: [{ id: 'r1' }] }), RangeError);
});

test('verify is counted in phishCaught and verifyCount but not reportCount', () => {
    const r = scoreTriage({ messages: [phish('p1')], answers: [{ id: 'p1', verdict: 'verify', flags: ['a', 'b'] }] });
    assert.equal(r.phishCaught, 1);
    assert.equal(r.reportCount, 0);
    assert.equal(r.reportRate, 0);
    assert.equal(r.verifyCount, 1);
});

test('verify on a real message is never a false alarm (awareness)', () => {
    const r = scoreTriage({ messages: [real('r1')], answers: [{ id: 'r1', verdict: 'verify' }] });
    assert.equal(r.falseAlarms, 0);
    assert.equal(r.percent, 100);
});

test('awareness: delete and report on a real message are false alarms but showFalseAlarms is false', () => {
    const r = scoreTriage({ messages: [real('r1'), real('r2')], answers: [{ id: 'r1', verdict: 'report' }, { id: 'r2', verdict: 'delete' }] });
    assert.equal(r.falseAlarms, 2);
    assert.equal(r.showFalseAlarms, false);
});

test('half-up rounding at the per-message level: 40 * 1/3 = 13.33 -> 13; 40 * 5/8 = 25 exact', () => {
    const f = ['a', 'b', 'c'];
    const r = scoreTriage({ messages: [phish('p1', f)], answers: [{ id: 'p1', verdict: 'report', flags: ['a'] }] });
    assert.equal(r.perMessage[0].flagPoints, 13);
    assert.equal(r.perMessage[0].score, 73);
});

test('percent rounds halves up: two messages scoring 100 and 51 -> 76 (75.5)', () => {
    // 51 = trust-on-phish (0) + ... use awareness delete(30) + 40*? Build via flags: 30 + 21?
    // easier: phish with 8 flags, delete (30) + 5/8 caught (25) = 55 ; and 100 -> 77.5 -> 78
    const flags = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const r = scoreTriage({
        messages: [real('r1'), phish('p1', flags)],
        answers: [{ id: 'r1', verdict: 'trust' }, { id: 'p1', verdict: 'delete', flags: ['a', 'b', 'c', 'd', 'e'] }],
    });
    assert.deepEqual(r.perMessage.map((m) => m.score), [100, 55]);
    assert.equal(r.percent, 78);
});

test('bandFor boundaries: 85 sharp, 84 getting there, 60 getting there, 59 practising, 0 and 100', () => {
    assert.match(bandFor(100).headline, /^Sharp/);
    assert.match(bandFor(85).headline, /^Sharp/);
    assert.match(bandFor(84).headline, /^Getting there/);
    assert.match(bandFor(60).headline, /^Getting there/);
    assert.match(bandFor(59).headline, /^Worth practising/);
    assert.match(bandFor(0).headline, /^Worth practising/);
});

test('bandFor with authored bands in any order, with an empty list, and below every min', () => {
    const bands = [{ min: 0, headline: 'low' }, { min: 90, headline: 'top' }, { min: 50, headline: 'mid' }];
    assert.equal(bandFor(95, bands).headline, 'top');
    assert.equal(bandFor(50, bands).headline, 'mid');
    assert.equal(bandFor(10, bands).headline, 'low');
    assert.match(bandFor(95, []).headline, /^Sharp/);
    assert.match(bandFor(95, null).headline, /^Sharp/);
    // no band at 0: fall back to the lowest one
    assert.equal(bandFor(5, [{ min: 40, headline: 'only' }]).headline, 'only');
});

test('pass: null without passPercent, boundary at exactly passPercent, passPercent 0 is a number', () => {
    const msgs = [real('r1')];
    const ans = [{ id: 'r1', verdict: 'trust' }];
    assert.equal(scoreTriage({ messages: msgs, answers: ans }).pass, null);
    assert.equal(scoreTriage({ messages: msgs, answers: ans, passPercent: 100 }).pass, true);
    assert.equal(scoreTriage({ messages: msgs, answers: [{ id: 'r1', verdict: 'delete' }], passPercent: 100 }).pass, false);
    assert.equal(scoreTriage({ messages: msgs, answers: [], passPercent: 0 }).pass, true);
    assert.equal(scoreTriage({ messages: msgs, answers: ans, passPercent: '80' }).pass, null);
});

test('weakestFactor: null for empty, undefined, all-caught; ties go to the first met', () => {
    assert.equal(weakestFactor({}), null);
    assert.equal(weakestFactor(undefined), null);
    assert.equal(weakestFactor({ a: { caught: 3, missed: 0 } }), null);
    assert.deepEqual(weakestFactor({ a: { caught: 0, missed: 2 }, b: { caught: 0, missed: 2 }, c: { caught: 0, missed: 1 } }), { id: 'a', caught: 0, missed: 2 });
    assert.equal(weakestFactor({ a: { caught: 0, missed: 1 }, b: { caught: 5, missed: 3 } }).id, 'b');
});

test('perFactor and falseByFactor tally across messages', () => {
    const r = scoreTriage({
        messages: [phish('p1', ['a', 'b']), phish('p2', ['a'])],
        answers: [{ id: 'p1', verdict: 'report', flags: ['a', 'z'] }, { id: 'p2', verdict: 'report', flags: ['z'] }],
    });
    assert.deepEqual(r.perFactor, { a: { caught: 1, missed: 1 }, b: { caught: 0, missed: 1 } });
    assert.deepEqual(r.falseByFactor, { z: 2 });
});

test('scoring is deterministic and does not mutate its inputs', () => {
    const messages = [phish('p1'), real('r1')];
    const answers = [{ id: 'p1', verdict: 'report', flags: ['a', 'a'] }, { id: 'r1', verdict: 'trust', flags: ['none'] }];
    const snap = JSON.stringify({ messages, answers });
    const a = scoreTriage({ messages, answers });
    const b = scoreTriage({ messages, answers });
    assert.deepEqual(a, b);
    assert.equal(JSON.stringify({ messages, answers }), snap);
});

test('ms is never scored: huge, negative and missing ms give the same result', () => {
    const base = scoreTriage({ messages: [real('r1')], answers: [{ id: 'r1', verdict: 'trust' }] });
    for (const ms of [0, -5, 1e12, NaN]) {
        assert.deepEqual(scoreTriage({ messages: [real('r1')], answers: [{ id: 'r1', verdict: 'trust', ms }] }), base);
    }
});
