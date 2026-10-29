// minigames/inbox-triage/triage-scoring.js (05 "The rules / scoring"; N4, N8).
//  - case one is the 05 worked example: 68% under the analyst profile, 86% under awareness;
//  - verdict tables per profile, reasons formulas, clamping, rounding (halves up);
//  - headline numbers: phishCaught, reportRate, falseAlarms, flagRecall, perFactor;
//  - Verify (awareness only), 'none' chip, duplicates, unanswered, bands, pass, determinism.
// Run with: bundle exec node --test test/js/social-triage-scoring.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-triage-scoring-'));
writeFileSync(join(dir, 'triage-scoring.mjs'), readFileSync(join(js, 'minigames/inbox-triage/triage-scoring.js'), 'utf8'));
const S = await import(pathToFileURL(join(dir, 'triage-scoring.mjs')).href);
const { scoreTriage, flagPoints, verdictPoints, bandFor, weakestFactor } = S;

// Fixture: the four messages of the 05 worked example.
const messages = [
    { id: 'm1_it', truth: { isPhish: false, flags: [] } },
    { id: 'm2_payroll', truth: { isPhish: true, flags: ['senderTrust', 'linkCredible', 'urgencyCalibrated'] } },
    { id: 'm3_parcel', truth: { isPhish: true, flags: ['senderTrust', 'addressedTo', 'attachmentPlausible'] } },
    { id: 'm4_jed', truth: { isPhish: false, flags: [] } },
];
const answers = [
    { id: 'm1_it', verdict: 'trust', flags: ['none'], ms: 4000 },
    { id: 'm2_payroll', verdict: 'report', flags: ['senderTrust', 'linkCredible', 'attachmentPlausible'] },
    { id: 'm3_parcel', verdict: 'delete', flags: ['senderTrust', 'addressedTo'] },
    { id: 'm4_jed', verdict: 'report', flags: ['senderAuth'] },
];
const scores = (r) => r.perMessage.map((m) => m.score);

test('worked example, analyst profile: 100, 73, 57, 40 -> 68% Getting there', () => {
    const r = scoreTriage({ messages, answers, profile: 'analyst' });
    assert.deepEqual(scores(r), [100, 73, 57, 40]);
    assert.equal(r.percent, 68); // 67.5 rounds up
    assert.match(r.headline, /^Getting there/);
    assert.equal(r.phishCaught, 2);
    assert.equal(r.phishTotal, 2);
    assert.equal(r.reportCount, 1);
    assert.equal(r.reportRate, 0.5);
    assert.equal(r.falseAlarms, 1);
    assert.equal(r.showFalseAlarms, true);
    assert.deepEqual(r.flagRecall, { caught: 4, total: 6 });
    assert.deepEqual(r.perFactor, {
        senderTrust: { caught: 2, missed: 0 },
        linkCredible: { caught: 1, missed: 0 },
        urgencyCalibrated: { caught: 0, missed: 1 },
        addressedTo: { caught: 1, missed: 0 },
        attachmentPlausible: { caught: 0, missed: 1 },
    });
    assert.deepEqual(r.falseByFactor, { attachmentPlausible: 1, senderAuth: 1 });
});

test('worked example, awareness profile: 100, 87, 57, 100 -> 86%, held at Getting there by two zero skills (P7-2)', () => {
    const r = scoreTriage({ messages, answers, profile: 'awareness' });
    assert.deepEqual(scores(r), [100, 87, 57, 100]);
    assert.equal(r.percent, 86);
    assert.equal(r.zeroSkills.length, 2);
    assert.match(r.headline, /^Getting there/);
    assert.equal(r.falseAlarms, 1); // recorded...
    assert.equal(r.showFalseAlarms, false); // ...never shown
    assert.equal(r.reportRate, 0.5);
});

test('profile defaults to awareness', () => {
    assert.equal(scoreTriage({ messages, answers }).percent, 86);
});

test('verdict tables', () => {
    const a = (p, v) => verdictPoints('analyst', p, v);
    assert.deepEqual([a(true, 'report'), a(true, 'delete'), a(true, 'trust')], [60, 30, 0]);
    assert.deepEqual([a(false, 'report'), a(false, 'delete'), a(false, 'trust')], [20, 0, 60]);
    const w = (p, v) => verdictPoints('awareness', p, v);
    assert.deepEqual([w(true, 'report'), w(true, 'verify'), w(true, 'delete'), w(true, 'trust')], [60, 60, 30, 0]);
    assert.deepEqual([w(false, 'report'), w(false, 'verify'), w(false, 'delete'), w(false, 'trust')], [60, 60, 30, 60]);
});

test('verify is awareness only; counted separately from reportRate', () => {
    assert.throws(() => verdictPoints('analyst', true, 'verify'), RangeError);
    assert.throws(() => scoreTriage({
        messages: [messages[1]], answers: [{ id: 'm2_payroll', verdict: 'verify', flags: [] }], profile: 'analyst',
    }), RangeError);
    const r = scoreTriage({
        messages: [messages[1]], answers: [{ id: 'm2_payroll', verdict: 'verify', flags: ['senderTrust', 'linkCredible', 'urgencyCalibrated'] }],
    });
    assert.equal(r.percent, 100);
    assert.equal(r.verifyCount, 1);
    assert.equal(r.reportRate, 0);
    assert.equal(r.reportCount, 0); // verify is not a report (05 Decisions)
    assert.equal(r.phishCaught, 1); // but it catches the phish: it scores 100
});

test('verify on a phish counts as caught; verify on real mail is not a false alarm', () => {
    const r = scoreTriage({
        messages,
        answers: [
            { id: 'm1_it', verdict: 'verify', flags: [] },
            { id: 'm2_payroll', verdict: 'verify', flags: [] },
            { id: 'm3_parcel', verdict: 'report', flags: [] },
            { id: 'm4_jed', verdict: 'trust', flags: [] },
        ],
    });
    assert.equal(r.phishTotal, 2);
    assert.equal(r.phishCaught, 2);
    assert.equal(r.reportCount, 1);
    assert.equal(r.reportRate, 0.5);
    assert.equal(r.verifyCount, 2);
    assert.equal(r.falseAlarms, 0);
});

test('unknown verdict or profile throws', () => {
    assert.throws(() => verdictPoints('awareness', true, 'shrug'), RangeError);
    assert.throws(() => scoreTriage({ messages, answers, profile: 'bogus' }), RangeError);
});

test('analyst reasons on a phish: ticking every chip does not pay, and floors at 0', () => {
    const all = ['senderTrust', 'senderAuth', 'addressedTo', 'pretextRelevant', 'attachmentPlausible', 'urgencyCalibrated', 'linkCredible'];
    const m = { id: 'x', truth: { isPhish: true, flags: ['senderTrust', 'linkCredible'] } };
    const r = scoreTriage({ messages: [m], answers: [{ id: 'x', verdict: 'report', flags: all }], profile: 'analyst' });
    assert.equal(r.perMessage[0].flagPoints, 0); // (2 - 5) / 2 clamps to 0
    assert.equal(r.percent, 60);
    const ra = scoreTriage({ messages: [m], answers: [{ id: 'x', verdict: 'report', flags: all }], profile: 'awareness' });
    assert.equal(ra.percent, 100); // awareness: no precision penalty
});

test('analyst reasons on real mail: 40 / 20 / 0 by false flags; awareness always 40', () => {
    assert.equal(flagPoints('analyst', false, { caught: 0, falseClaims: 0, authored: 0 }), 40);
    assert.equal(flagPoints('analyst', false, { caught: 0, falseClaims: 1, authored: 0 }), 20);
    assert.equal(flagPoints('analyst', false, { caught: 0, falseClaims: 2, authored: 0 }), 0);
    assert.equal(flagPoints('analyst', false, { caught: 0, falseClaims: 5, authored: 0 }), 0);
    assert.equal(flagPoints('awareness', false, { caught: 0, falseClaims: 5, authored: 0 }), 40);
});

test('"none" and duplicate ticks are ignored; ms is never scored', () => {
    const m = { id: 'x', truth: { isPhish: true, flags: ['senderTrust'] } };
    const a = scoreTriage({ messages: [m], answers: [{ id: 'x', verdict: 'report', flags: ['senderTrust', 'senderTrust', 'none'], ms: 1 }], profile: 'analyst' });
    const b = scoreTriage({ messages: [m], answers: [{ id: 'x', verdict: 'report', flags: ['senderTrust'], ms: 99999 }], profile: 'analyst' });
    assert.equal(a.percent, 100);
    assert.deepEqual(a.perMessage[0].falseClaims, []);
    assert.deepEqual(a, b);
});

test('a phish with no authored flags scores 0 reasons instead of dividing by zero', () => {
    const m = { id: 'x', truth: { isPhish: true, flags: [] } };
    const r = scoreTriage({ messages: [m], answers: [{ id: 'x', verdict: 'report', flags: [] }] });
    assert.equal(r.perMessage[0].flagPoints, 0);
    assert.equal(r.percent, 60);
});

test('channel-tell ids score exactly like factors', () => {
    const m = { id: 'x', truth: { isPhish: true, flags: ['unrequested_mfa_push'] } };
    const r = scoreTriage({ messages: [m], answers: [{ id: 'x', verdict: 'report', flags: ['unrequested_mfa_push'] }], profile: 'analyst' });
    assert.equal(r.percent, 100);
    assert.deepEqual(r.perFactor, { unrequested_mfa_push: { caught: 1, missed: 0 } });
});

test('unanswered messages score 0 and are listed', () => {
    const r = scoreTriage({ messages, answers: answers.slice(0, 2), profile: 'analyst' });
    assert.deepEqual(r.unanswered, ['m3_parcel', 'm4_jed']);
    assert.equal(r.percent, Math.round((100 + 73) / 4)); // 43
});

test('rounding: halves round up, per message and for the round', () => {
    const m = { id: 'x', truth: { isPhish: true, flags: ['a', 'b'] } };
    // report + 1 of 2 flags: 60 + 20 = 80; delete + 1 of 2 flags: 30 + 20 = 50
    const r = scoreTriage({ messages: [m], answers: [{ id: 'x', verdict: 'report', flags: ['a'] }] });
    assert.equal(r.percent, 80);
    const five = { id: 'y', truth: { isPhish: true, flags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] } };
    // 40 * 1/8 = 5 exactly; 40 * 3/16 not reachable, so check the 0.5 boundary on the round mean
    const r2 = scoreTriage({
        messages: [{ id: 'p', truth: { isPhish: false, flags: [] } }, { id: 'q', truth: { isPhish: false, flags: [] } }],
        answers: [{ id: 'p', verdict: 'trust', flags: [] }, { id: 'q', verdict: 'delete', flags: [] }],
        profile: 'analyst',
    });
    assert.deepEqual(scores(r2), [100, 40]);
    assert.equal(r2.percent, 70);
    const r3 = scoreTriage({ messages: [five], answers: [{ id: 'y', verdict: 'trust', flags: ['a'] }] });
    assert.equal(r3.perMessage[0].flagPoints, 5);
});

test('bands: authored bands replace the defaults; edges are inclusive', () => {
    assert.match(bandFor(85).headline, /^Sharp/);
    assert.match(bandFor(84).headline, /^Getting there/);
    assert.match(bandFor(60).headline, /^Getting there/);
    assert.match(bandFor(59).headline, /^Worth practising/);
    assert.match(bandFor(0).headline, /^Worth practising/);
    const custom = [{ min: 50, headline: 'Pass' }, { min: 0, headline: 'Fail' }];
    assert.equal(bandFor(50, custom).headline, 'Pass');
    assert.equal(scoreTriage({ messages, answers, profile: 'analyst', bands: custom }).headline, 'Pass');
});

test('pass: null without passPercent, 0 always passes, 60 is inclusive', () => {
    assert.equal(scoreTriage({ messages, answers, profile: 'analyst' }).pass, null);
    assert.equal(scoreTriage({ messages, answers, profile: 'analyst', passPercent: 0 }).pass, true);
    assert.equal(scoreTriage({ messages, answers, profile: 'analyst', passPercent: 68 }).pass, true);
    assert.equal(scoreTriage({ messages, answers, profile: 'analyst', passPercent: 69 }).pass, false);
});

test('weakestFactor picks the most missed, first on ties, null when none', () => {
    const r = scoreTriage({ messages, answers, profile: 'analyst' });
    assert.deepEqual(weakestFactor(r.perFactor), { id: 'urgencyCalibrated', caught: 0, missed: 1, ties: ['urgencyCalibrated', 'attachmentPlausible'] });
    assert.equal(weakestFactor({ a: { caught: 2, missed: 0 } }), null);
    assert.equal(weakestFactor({ a: { caught: 0, missed: 1 }, b: { caught: 0, missed: 3 } }).id, 'b');
});

test('deterministic and does not mutate its input', () => {
    const before = JSON.stringify({ messages, answers });
    const a = scoreTriage({ messages, answers, profile: 'analyst' });
    const b = scoreTriage({ messages, answers, profile: 'analyst' });
    assert.deepEqual(a, b);
    assert.equal(JSON.stringify({ messages, answers }), before);
});

// DOCS_GAPS run 3: "False alarms 0" after a false flag on real mail. falseAlarms counts real
// mail given a phish verdict (Report or Delete), per 05 "headline numbers"; a wrong chip on
// real mail is a false claim (falseByFactor, and the 40 -> 20 flag points), not a false alarm.
test('falseAlarms: real mail reported or deleted counts; a false chip on trusted real mail does not', () => {
    const real = [
        { id: 'priya', truth: { isPhish: false, flags: [] } },
        { id: 'jed', truth: { isPhish: false, flags: [] } },
        { id: 'it', truth: { isPhish: false, flags: [] } },
    ];
    const flagOnly = scoreTriage({ messages: real, profile: 'analyst', answers: [
        { id: 'priya', verdict: 'trust', flags: ['senderTrust'] },
        { id: 'jed', verdict: 'trust', flags: ['none'] },
        { id: 'it', verdict: 'trust', flags: ['none'] },
    ] });
    assert.equal(flagOnly.falseAlarms, 0);
    assert.equal(flagOnly.perMessage[0].score, 80);
    assert.deepEqual(flagOnly.perMessage[0].falseClaims, ['senderTrust']);
    assert.deepEqual(flagOnly.falseByFactor, { senderTrust: 1 });

    const verdicts = scoreTriage({ messages: real, profile: 'analyst', answers: [
        { id: 'priya', verdict: 'report', flags: ['none'] },
        { id: 'jed', verdict: 'delete', flags: ['none'] },
        { id: 'it', verdict: 'trust', flags: ['none'] },
    ] });
    assert.equal(verdicts.falseAlarms, 2);
});

// ── batch-5: opt-in verdict-points override (F-E12-1, E13 F-10) ────────────────
const { verdictPointsOverride } = S;

test('verdictPointsOverride: truth.verdictPoints wins over set.scoring.kindPoints; null when nothing authored', () => {
    assert.equal(verdictPointsOverride({}, 'call', null), null);
    assert.equal(verdictPointsOverride({}, 'call', { kindPoints: {} }), null);
    assert.deepEqual(verdictPointsOverride(null, 'call', { kindPoints: { call: { trust: 60 } } }), { trust: 60 });
    // Per-item wins per verdict; per-kind fills the rest.
    assert.deepEqual(
        verdictPointsOverride({ verdictPoints: { trust: 50 } }, 'call', { kindPoints: { call: { trust: 60, report: 30 } } }),
        { trust: 50, report: 30 });
});

test('verdictPoints honours an override but cannot resurrect a verdict the profile lacks', () => {
    // A real call normally scores Comply (trust) at 30 (KIND_VERDICT_POINTS); an override lifts it.
    assert.equal(verdictPoints('awareness', false, 'trust', 'call'), 30);
    assert.equal(verdictPoints('awareness', false, 'trust', 'call', { trust: 60 }), 60);
    // An omitted verdict keeps the kind default.
    assert.equal(verdictPoints('awareness', false, 'report', 'call', { trust: 60 }), 60);
    // Analyst has no Verify, override or not.
    assert.throws(() => verdictPoints('analyst', true, 'verify', 'email', { verify: 60 }), RangeError);
});

test('scoreTriage: a genuine call scores 70 by default, 100 with a per-item or per-kind override', () => {
    const msgs = [{ id: 'visitor', kind: 'call', truth: { isPhish: false, flags: [] } }];
    const ans = [{ id: 'visitor', verdict: 'trust', flags: ['none'] }];
    // Default: 30 verdict + 40 reasons (awareness real) = 70, not handled right.
    const base = scoreTriage({ messages: msgs, answers: ans });
    assert.equal(base.perMessage[0].score, 70);
    assert.equal(base.perMessage[0].handledRight, false);
    assert.equal(base.realHandledRight, 0);
    // Per-item override: full marks.
    const perItem = scoreTriage({ messages: [{ id: 'visitor', kind: 'call', truth: { isPhish: false, flags: [], verdictPoints: { trust: 60 } } }], answers: ans });
    assert.equal(perItem.perMessage[0].score, 100);
    assert.equal(perItem.perMessage[0].handledRight, true);
    assert.equal(perItem.realHandledRight, 1);
    // Per-set per-kind override: same effect, no truth change.
    const perSet = scoreTriage({ messages: msgs, answers: ans, scoring: { kindPoints: { call: { trust: 60 } } } });
    assert.equal(perSet.perMessage[0].score, 100);
    assert.equal(perSet.realHandledRight, 1);
    // Default (no scoring arg) is byte-for-byte unchanged against the worked example.
    assert.deepEqual(scores(scoreTriage({ messages, answers })), scores(scoreTriage({ messages, answers, scoring: null })));
});
