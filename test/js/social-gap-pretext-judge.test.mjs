// Gap tests for systems/pretext-judge.js (pure): empty and malformed inputs, the cap on match
// credit, clamping, tell detail levels, verification and refusal boundaries, band ranking, and
// whether an ask that pushes influence past the "reports" threshold reports the call.
// Run with: bin/test-js test/js/social-gap-pretext-judge.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-judge-'));
writeFileSync(join(dir, 'pretext-judge.mjs'), readFileSync(join(js, 'systems/pretext-judge.js'), 'utf8'));
const J = await import(pathToFileURL(join(dir, 'pretext-judge.mjs')).href);

const tell = (s) => ({ pass: `${s} ok`, fail: `${s}: {said} not {actual}`, failCategory: `${s} mismatch`, unknown: `${s} uncheckable` });
const spec = (over = {}) => ({
    susceptibility: { urgency: -10, candour: 10 },
    unverifiableCost: -10,
    tuning: { maxRefusals: 2, matchCreditCapPerLine: 10, tellDetail: 'full' },
    influence: { min: -100, max: 100, start: 0 },
    thresholds: [
        { id: 'wary', at: -40 }, { id: 'refuses', at: -50 },
        { id: 'reports', at: -70, effects: [{ type: 'lockout' }] },
    ],
    knows: {
        a: { value: 'va', accept: ['va2'], grade: 'identity' },
        b: { value: 'vb', grade: 'lesser' },
        c: { value: 'vc' },
    },
    lines: {
        say_a: { claims: [{ fact: 'a', from: 'blank:a' }] },
        say_ab: { claims: [{ fact: 'a', from: 'blank:a' }, { fact: 'b', from: 'blank:b' }] },
        say_abc: { claims: [{ fact: 'a', from: 'blank:a' }, { fact: 'b', from: 'blank:b' }, { fact: 'c', from: 'blank:c' }] },
        fixed: { claims: [{ fact: 'a', value: 'va' }, { fact: 'b', from: 'vb' }] },
        unknown_fact: { claims: [{ fact: 'zz', from: 'blank:zz' }] },
        pushy: { technique: 'urgency', also: ['urgency', 5, null, 'nothing_listed'], claims: [] },
        fix_a: { repairs: 'a', claims: [{ fact: 'a', from: 'blank:a' }] },
        fix_a_candour: { repairs: 'a', technique: 'candour', claims: [{ fact: 'a', from: 'blank:a' }] },
        double_a: { doublesDown: 'a', claims: [] },
        double_a_custom: { doublesDown: 'a', extra: -35, claims: [] },
    },
    asks: {},
    tells: { a: tell('A'), b: tell('B'), c: tell('C'), zz: tell('ZZ'), techniques: { urgency: 'Urgency' }, repair: 'Owned it', ask: { accepted: 'ok', pending: 'wait', refused: 'no' } },
    ...over,
});
const sess = (over = {}) => ({ openMismatches: [], pendingVerification: [], provenFacts: [], refusals: 0, verified: {}, ...over });
const deltas = (r) => r.entries.map((e) => e.delta);

// ── empty and malformed inputs ───────────────────────────────────────────────

test('an unknown utterance id adds nothing: no entries, influence and band unchanged', () => {
    const r = J.judgeUtterance(spec(), sess(), 'no_such_line', {}, -45);
    assert.deepEqual(r.entries, []);
    assert.equal(r.influenceAfter, -45);
    assert.equal(r.band, J.BAND.WARY);
    assert.equal(r.reported, false);
});

test('null spec and null session are tolerated for an empty line', () => {
    const r = J.judgeUtterance(null, null, 'x', null, 0);
    assert.deepEqual(r.entries, []);
    assert.equal(r.band, 0);
    assert.equal(J.judgeUtterance(undefined, undefined, undefined, undefined, 0).influenceAfter, 0);
});

test('a missing influence argument gives NaN influence after; the band falls back to calm (documents the gap)', () => {
    const r = J.judgeUtterance(spec(), sess(), 'say_a', { a: 'va' }, undefined);
    assert.ok(Number.isNaN(r.influenceAfter));
    assert.equal(r.band, J.BAND.CALM);
});

test('a missing blank for a known fact is a mismatch, not a crash or a free pass', () => {
    const r = J.judgeUtterance(spec(), sess(), 'say_a', {}, 0);
    assert.deepEqual(deltas(r), [-30]);
    assert.deepEqual(r.opens, ['a']);
    assert.deepEqual(J.judgeUtterance(spec(), sess(), 'say_a', undefined, 0).opens, ['a']);
    assert.deepEqual(J.judgeUtterance(spec(), sess(), 'say_a', { a: null }, 0).opens, ['a']);
});

test('a claim with no fact id, or a null claim, is skipped', () => {
    const s = spec({ lines: { l: { claims: [null, {}, { fact: 5 }, { fact: 'a', from: 'blank:a' }] } } });
    assert.equal(J.judgeUtterance(s, sess(), 'l', { a: 'va' }, 0).entries.length, 1);
});

// ── claims ───────────────────────────────────────────────────────────────────

test('matching: the value, an accepted alternative, and a { value, label } blank all match; wrong case does not', () => {
    for (const blank of ['va', 'va2', { value: 'va', label: 'Whatever' }, { value: 'va2' }]) {
        assert.deepEqual(deltas(J.judgeUtterance(spec(), sess(), 'say_a', { a: blank }, 0)), [10], JSON.stringify(blank));
    }
    assert.deepEqual(deltas(J.judgeUtterance(spec(), sess(), 'say_a', { a: 'VA' }, 0)), [-30]);
});

test('a blank may be keyed by the fact id when the claim names a different blank', () => {
    const s = spec({ lines: { l: { claims: [{ fact: 'a', from: 'blank:name_a' }] } } });
    assert.deepEqual(deltas(J.judgeUtterance(s, sess(), 'l', { a: 'va' }, 0)), [10]);
});

test('fixed claims: value on the claim, or a non-blank "from" literal', () => {
    assert.deepEqual(deltas(J.judgeUtterance(spec(), sess(), 'fixed', {}, 0)), [10, 0]); // second is capped at 10 per line
    const s = spec({ tuning: { matchCreditCapPerLine: 100 } });
    assert.deepEqual(deltas(J.judgeUtterance(s, sess(), 'fixed', {}, 0)), [10, 10]);
});

test('grades: identity -30, lesser -20, missing or unknown grade falls back to lesser', () => {
    const r = J.judgeUtterance(spec(), sess(), 'say_abc', { a: 'x', b: 'x', c: 'x' }, 0);
    assert.deepEqual(deltas(r), [-30, -20, -20]);
    assert.deepEqual(r.opens, ['a', 'b', 'c']);
});

test('an unverifiable claim costs unverifiableCost, uncapped, and does not use up the match cap', () => {
    const s = spec({ lines: { l: { claims: [{ fact: 'zz', from: 'blank:zz' }, { fact: 'zz2', from: 'blank:q' }, { fact: 'a', from: 'blank:a' }] } } });
    const r = J.judgeUtterance(s, sess(), 'l', { zz: 'x', q: 'y', a: 'va' }, 0);
    assert.deepEqual(deltas(r), [-10, -10, 10]);
    assert.equal(J.judgeUtterance(spec({ unverifiableCost: undefined }), sess(), 'unknown_fact', { zz: 'x' }, 0).entries[0].delta, -10);
    assert.equal(J.judgeUtterance(spec({ unverifiableCost: -3 }), sess(), 'unknown_fact', { zz: 'x' }, 0).entries[0].delta, -3);
    assert.equal(J.judgeUtterance(spec({ unverifiableCost: 0 }), sess(), 'unknown_fact', { zz: 'x' }, 0).entries[0].delta, 0);
});

test('match credit cap per line: default 10, custom 15 splits, 0 earns nothing, negative never earns negative', () => {
    const blanks = { a: 'va', b: 'vb', c: 'vc' };
    assert.deepEqual(deltas(J.judgeUtterance(spec(), sess(), 'say_abc', blanks, 0)), [10, 0, 0]);
    assert.deepEqual(deltas(J.judgeUtterance(spec({ tuning: { matchCreditCapPerLine: 15 } }), sess(), 'say_abc', blanks, 0)), [10, 5, 0]);
    assert.deepEqual(deltas(J.judgeUtterance(spec({ tuning: { matchCreditCapPerLine: 0 } }), sess(), 'say_abc', blanks, 0)), [0, 0, 0]);
    assert.deepEqual(deltas(J.judgeUtterance(spec({ tuning: { matchCreditCapPerLine: -5 } }), sess(), 'say_abc', blanks, 0)), [0, 0, 0]);
});

test('a mismatch does not use up the cap: a later true claim on the same line still earns', () => {
    assert.deepEqual(deltas(J.judgeUtterance(spec(), sess(), 'say_ab', { a: 'wrong', b: 'vb' }, 0)), [-30, 10]);
});

test('a fact already proven earlier in the call earns 0 and is not proven again', () => {
    const r = J.judgeUtterance(spec(), sess({ provenFacts: ['a'] }), 'say_a', { a: 'va' }, 0);
    assert.deepEqual(deltas(r), [0]);
    assert.deepEqual(r.proven, ['a']); // still reported so the binding stays consistent
});

test('the same fact claimed twice on one line earns once and is proven once', () => {
    const s = spec({ lines: { l: { claims: [{ fact: 'a', from: 'blank:a' }, { fact: 'a', from: 'blank:a' }] } } });
    const r = J.judgeUtterance(s, sess(), 'l', { a: 'va' }, 0);
    assert.deepEqual(r.proven, ['a']);
    assert.deepEqual(deltas(r), [10, 0]);
});

test('a wrong claim then the right one on the next line: the mismatch stays open until a repair line', () => {
    const open = J.judgeUtterance(spec(), sess(), 'say_a', { a: 'x' }, 0);
    assert.deepEqual(open.opens, ['a']);
    const again = J.judgeUtterance(spec(), sess({ openMismatches: ['a'] }), 'say_a', { a: 'va' }, 0);
    assert.deepEqual(again.repairs, []); // saying it right again is not, by itself, a repair
    assert.deepEqual(deltas(again), [10]);
});

// ── verification ─────────────────────────────────────────────────────────────

test('a matching claim on a pending fact clears it; a wrong one reports the call at once', () => {
    const ok = J.judgeUtterance(spec(), sess({ pendingVerification: ['a'] }), 'say_a', { a: 'va' }, 0);
    assert.deepEqual(ok.verificationCleared, ['a']);
    assert.equal(ok.reported, false);
    const bad = J.judgeUtterance(spec(), sess({ pendingVerification: ['a'] }), 'say_a', { a: 'x' }, 0);
    assert.equal(bad.reported, true);
    assert.equal(bad.reportReason, 'verificationFailed');
    assert.deepEqual(J.judgeUtterance(spec(), sess({ pendingVerification: ['b'] }), 'say_a', { a: 'va' }, 0).verificationCleared, []);
});

// ── repairs and doubling down ────────────────────────────────────────────────

test('repair requires the fact to be open; on a closed fact the line is judged as a plain claim', () => {
    const closed = J.judgeUtterance(spec(), sess(), 'fix_a', { a: 'va' }, 0);
    assert.deepEqual(closed.repairs, []);
    assert.deepEqual(deltas(closed), [10]);
    const open = J.judgeUtterance(spec(), sess({ openMismatches: ['a'] }), 'fix_a', { a: 'va' }, 0);
    assert.deepEqual(open.repairs, ['a']);
    assert.deepEqual(deltas(open), [10, 10]); // claim credit then candour
    assert.equal(open.entries[1].reason, 'candour');
    assert.equal(open.entries[1].line, 'Owned it');
});

test('repair uses the line technique as the candour key and takes its susceptibility', () => {
    const s = spec({ susceptibility: { candour: 25 } });
    const r = J.judgeUtterance(s, sess({ openMismatches: ['a'] }), 'fix_a_candour', { a: 'va' }, 0);
    assert.deepEqual(deltas(r), [10, 25]);
    assert.equal(r.entries.filter((e) => e.reason === 'candour').length, 1, 'the technique is consumed, not counted again');
});

test('a character whose candour susceptibility is authored as 0 gets 0 for a repair, not the default +10', () => {
    // susceptibility() returns 0 for a missing key and for an authored 0 alike, and the repair
    // code uses `|| DEFAULTS.candourCredit`, so an NPC authored to ignore candour still pays +10.
    const s = spec({ susceptibility: { urgency: -10, candour: 0 } });
    const r = J.judgeUtterance(s, sess({ openMismatches: ['a'] }), 'fix_a', { a: 'va' }, 0);
    assert.equal(r.entries[1].delta, 0);
});

test('a repair line with a still-wrong blank does not earn repair credit or close the mismatch', () => {
    // The repair branch removes the fact's claim before the claims loop, so the corrected value
    // is never compared with what the NPC knows. Picking a wrong value on the repair line earns
    // +10 and the candour +10 and clears the open mismatch.
    const r = J.judgeUtterance(spec(), sess({ openMismatches: ['a'] }), 'fix_a', { a: 'still-wrong' }, 0);
    assert.deepEqual(r.repairs, []);
    assert.ok(!deltas(r).some((d) => d > 0), `deltas were ${JSON.stringify(deltas(r))}`);
});

test('doubling down on an open fact costs the line extra (default -20), only while open', () => {
    assert.deepEqual(deltas(J.judgeUtterance(spec(), sess({ openMismatches: ['a'] }), 'double_a', {}, 0)), [-20]);
    assert.deepEqual(deltas(J.judgeUtterance(spec(), sess({ openMismatches: ['a'] }), 'double_a_custom', {}, 0)), [-35]);
    assert.deepEqual(deltas(J.judgeUtterance(spec(), sess(), 'double_a', {}, 0)), []);
});

// ── techniques ───────────────────────────────────────────────────────────────

test('techniques: primary plus "also", non-strings skipped, unlisted technique is a 0 entry, duplicates stack', () => {
    const r = J.judgeUtterance(spec(), sess(), 'pushy', {}, 0);
    assert.deepEqual(deltas(r), [-10, -10, 0]);
    assert.deepEqual(r.entries.map((e) => e.reason), ['urgency', 'urgency', 'nothing_listed']);
});

// ── clamping, bands, reporting ───────────────────────────────────────────────

test('influence after a line is clamped to the character bounds on both sides', () => {
    const s = spec({ influence: { min: -50, max: 20 } });
    assert.equal(J.judgeUtterance(s, sess(), 'say_ab', { a: 'x', b: 'x' }, -40).influenceAfter, -50);
    assert.equal(J.judgeUtterance(s, sess(), 'say_a', { a: 'va' }, 18).influenceAfter, 20);
    const flat = spec({ influence: undefined, min: -5, max: 5 });
    assert.equal(J.judgeUtterance(flat, sess(), 'say_a', { a: 'va' }, 3).influenceAfter, 5);
    const none = spec({ influence: undefined });
    assert.equal(J.judgeUtterance(none, sess(), 'say_a', { a: 'x' }, -90).influenceAfter, -100);
});

test('crossing "reports" on a line reports the call; landing exactly on the threshold counts; one above does not', () => {
    assert.equal(J.judgeUtterance(spec(), sess(), 'say_a', { a: 'x' }, -40).reported, true); // -70 exactly
    const r = J.judgeUtterance(spec(), sess(), 'say_a', { a: 'x' }, -39); // -69
    assert.equal(r.reported, false);
    assert.equal(r.band, J.BAND.REFUSING);
});

test('a reports threshold with a lockout effect is band 3 (reports), not 4; a lockout effect on another id is 4; "locked" follows band 4', () => {
    assert.equal(J.bandForInfluence([{ id: 'reports', at: -70, effects: [{ type: 'lockout' }] }], -80), J.BAND.REPORTED);
    assert.equal(J.bandForInfluence([{ id: 'custom', at: -70, effects: [{ type: 'lockout' }] }], -80), J.BAND.LOCKED);
    const s = spec({ thresholds: [{ id: 'lockout', at: -60 }] });
    const r = J.judgeUtterance(s, sess(), 'say_a', { a: 'x' }, -40);
    assert.equal(r.locked, true);
    assert.equal(r.reported, true);
});

test('bandForInfluence: "above" thresholds, unknown ids rank 0, junk thresholds skipped, highest rank wins in any order', () => {
    assert.equal(J.bandForInfluence([{ id: 'trusts', at: 40, when: 'above' }], 90), 0);
    assert.equal(J.bandForInfluence([{ id: 'wary', at: 10, when: 'above' }], 10), 1);
    assert.equal(J.bandForInfluence([{ id: 'wary', at: 10, when: 'above' }], 9), 0);
    assert.equal(J.bandForInfluence([null, {}, { id: 'wary' }, { id: 'refuses', at: 'x' }, { at: -1 }], -50), 0);
    const th = [{ id: 'reports', at: -70 }, { id: 'wary', at: -40 }, { id: 'refuses', at: -50 }];
    assert.equal(J.bandForInfluence(th, -60), 2);
    assert.equal(J.bandForInfluence([...th].reverse(), -75), 3);
    assert.equal(J.bandForInfluence(null, -100), 0);
    assert.equal(J.bandForInfluence(undefined, -100), 0);
});

// ── tell detail ──────────────────────────────────────────────────────────────

test('tellDetail full fills {said}/{actual}; category uses failCategory (else full); none gives empty lines; junk reads as full', () => {
    const lineOf = (tuning) => J.judgeUtterance(spec({ tuning }), sess(), 'say_a', { a: { value: 'x', label: 'Ex' } }, 0).entries[0].line;
    assert.equal(lineOf({ tellDetail: 'full' }), 'A: Ex not va');
    assert.equal(lineOf({ tellDetail: 'category' }), 'A mismatch');
    assert.equal(lineOf({ tellDetail: 'none' }), '');
    assert.equal(lineOf({ tellDetail: 'verbose' }), 'A: Ex not va');
    assert.equal(lineOf(undefined), 'A: Ex not va');
    const noCat = spec({ tuning: { tellDetail: 'category' }, tells: { a: { fail: 'F {said}/{actual}' } } });
    assert.equal(J.judgeUtterance(noCat, sess(), 'say_a', { a: 'x' }, 0).entries[0].line, 'F x/va');
});

test('labels: a blank\'s label wins, then spec.labels for the value id, then the raw id; every {said} is replaced', () => {
    const s = spec({ labels: { x: 'Spec label', va: 'Real label' }, tells: { a: { fail: '{said}|{said}|{actual}' } } });
    assert.equal(J.judgeUtterance(s, sess(), 'say_a', { a: { value: 'x', label: 'Blank label' } }, 0).entries[0].line, 'Blank label|Blank label|Real label');
    assert.equal(J.judgeUtterance(s, sess(), 'say_a', { a: 'x' }, 0).entries[0].line, 'Spec label|Spec label|Real label');
    assert.equal(J.judgeUtterance(s, sess(), 'say_a', { a: 'unlisted' }, 0).entries[0].line, 'unlisted|unlisted|Real label');
});

test('a missing tell block gives empty strings, never "undefined"', () => {
    const s = spec({ tells: undefined });
    const r = J.judgeUtterance(s, sess(), 'say_abc', { a: 'x', b: 'vb', c: 'vc' }, 0);
    for (const e of r.entries) assert.equal(e.line, '');
});

// ── purity ───────────────────────────────────────────────────────────────────

test('frozen spec, session and blanks are not mutated by either judge', () => {
    const deepFreeze = (o) => { Object.values(o).forEach((v) => { if (v && typeof v === 'object') deepFreeze(v); }); return Object.freeze(o); };
    const s = deepFreeze(spec({ asks: { ask1: { pressure: -5, floor: -60, verification: ['a'] } } }));
    const ses = deepFreeze(sess({ openMismatches: ['a'], provenFacts: ['b'], pendingVerification: ['c'] }));
    const bl = deepFreeze({ a: { value: 'x', label: 'X' }, b: 'vb' });
    assert.doesNotThrow(() => J.judgeUtterance(s, ses, 'say_ab', bl, 0));
    assert.doesNotThrow(() => J.judgeAsk(s, ses, 'ask1', 0));
});

// ── asks ─────────────────────────────────────────────────────────────────────

const askSpec = (asks, over = {}) => spec({ asks, ...over });

test('an unknown ask id behaves like an ask with no pressure, floor or verification: granted while above the refuses threshold', () => {
    const r = J.judgeAsk(askSpec({}), sess(), 'nope', -10);
    assert.equal(r.result, 'granted');
    assert.equal(r.inkResult, J.ASK_RESULT.granted);
    assert.deepEqual(r.entries, []);
    assert.equal(r.floorUsed, -50); // the refuses threshold stands in
    assert.equal(J.judgeAsk(askSpec({}), sess(), 'nope', -50).result, 'granted'); // equality passes the floor
    assert.equal(J.judgeAsk(askSpec({}), sess(), 'nope', -51).result, 'refused');
});

test('no floor and no refuses threshold: nothing blocks the ask and floorUsed is null', () => {
    const r = J.judgeAsk(askSpec({ a: {} }, { thresholds: [{ id: 'wary', at: -40 }] }), sess(), 'a', -100);
    assert.equal(r.result, 'granted');
    assert.equal(r.floorUsed, null);
});

test('pressure is applied before the floor test, clamps to the bounds, and a zero pressure adds no entry', () => {
    const s = askSpec({ p: { pressure: -20, floor: -30 }, z: { pressure: 0, floor: -30 } });
    assert.equal(J.judgeAsk(s, sess(), 'p', -15).result, 'refused'); // -35 < -30
    assert.equal(J.judgeAsk(s, sess(), 'p', -10).result, 'granted'); // -30 passes (equality)
    assert.equal(J.judgeAsk(s, sess(), 'z', 0).entries.length, 0);
    assert.equal(J.judgeAsk(s, sess(), 'p', -95).influenceAfter, -100);
    const up = askSpec({ g: { pressure: 500, floor: 0 } });
    assert.equal(J.judgeAsk(up, sess(), 'g', 0).influenceAfter, 100);
});

test('verification: pending until every fact is proven or the ask is marked verified; partial proof is still pending', () => {
    const s = askSpec({ v: { floor: -100, verification: ['a', 'b'] } });
    assert.equal(J.judgeAsk(s, sess(), 'v', 0).result, 'pending');
    assert.equal(J.judgeAsk(s, sess({ provenFacts: ['a'] }), 'v', 0).result, 'pending');
    assert.equal(J.judgeAsk(s, sess({ provenFacts: ['a', 'b'] }), 'v', 0).result, 'granted');
    assert.equal(J.judgeAsk(s, sess({ verified: { v: true } }), 'v', 0).result, 'granted');
    assert.equal(J.judgeAsk(s, sess({ verified: { v: 'true' } }), 'v', 0).result, 'pending');
    assert.equal(J.judgeAsk(s, null, 'v', 0).result, 'pending');
});

test('pending hands back a copy of the verification list; a refusal below the floor wins over pending', () => {
    const s = askSpec({ v: { floor: -20, verification: ['a'] } });
    const r = J.judgeAsk(s, sess(), 'v', 0);
    assert.deepEqual(r.verificationNeeded, ['a']);
    r.verificationNeeded.push('x');
    assert.deepEqual(s.asks.v.verification, ['a']);
    assert.equal(J.judgeAsk(s, sess(), 'v', -30).result, 'refused');
});

test('refusals: with maxRefusals 2 the second refusal reports, the first does not; 1 reports at once; 0 reports at once too', () => {
    const s = (max) => askSpec({ r: { floor: 0 } }, { tuning: { maxRefusals: max } });
    assert.equal(J.judgeAsk(s(2), sess({ refusals: 0 }), 'r', -10).reported, false);
    assert.equal(J.judgeAsk(s(2), sess({ refusals: 1 }), 'r', -10).reported, true);
    assert.equal(J.judgeAsk(s(2), sess({ refusals: 1 }), 'r', -10).reportReason, 'maxRefusals');
    assert.equal(J.judgeAsk(s(1), sess({ refusals: 0 }), 'r', -10).reported, true);
    assert.equal(J.judgeAsk(s(0), sess({ refusals: 0 }), 'r', -10).reported, true);
    assert.equal(J.judgeAsk(askSpec({ r: { floor: 0 } }, { tuning: undefined }), sess({ refusals: 1 }), 'r', -10).reported, true); // default 2
    assert.equal(J.judgeAsk(s(2), sess({ refusals: 'x' }), 'r', -10).reported, false);
    assert.equal(J.judgeAsk(s(2), sess({ refusals: 5 }), 'r', 10).reported, false); // a grant never reports on refusals
});

test('an ask whose pressure pushes influence past the "reports" threshold reports the call, like a line does', () => {
    // judgeUtterance sets reported/threshold when the band reaches REPORTED. judgeAsk computes the
    // band after pressure but only reports on maxRefusals, so an ask that crosses "reports" is
    // granted or softly refused with no report. The influence service still fires the threshold
    // effects, so the character is reported while the session's reportedThisCall stays false.
    const s = askSpec({ hard: { pressure: -40, floor: -100 } });
    const r = J.judgeAsk(s, sess(), 'hard', -40); // -80, past reports at -70
    assert.equal(r.band, J.BAND.REPORTED);
    assert.equal(r.reported, true);
});

test('a granted ask and a refused ask both return the matching tell line', () => {
    const s = askSpec({ g: { floor: -100 }, r: { floor: 0 } });
    assert.equal(J.judgeAsk(s, sess(), 'g', 0).line, 'ok');
    assert.equal(J.judgeAsk(s, sess(), 'r', -5).line, 'no');
    assert.equal(J.judgeAsk(askSpec({ g: {} }, { tuning: { tellDetail: 'none' } }), sess(), 'g', 0).line, '');
});

test('judgeAsk with null spec does not throw', () => {
    const r = J.judgeAsk(null, null, 'x', 0);
    assert.equal(r.result, 'granted');
});
